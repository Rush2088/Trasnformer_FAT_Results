#!/usr/bin/env python3
"""
tx_fat_utils.py  —  Config-driven extraction engine + Excel style helpers
=========================================================================
Imported by tx_fat_extract.py (Step 1) and tx_fat_normalise.py (Step 2).
Do not run this file directly.

Config-driven design
--------------------
All extraction patterns, field labels, range checks and engineering roles
are defined in a batch_config.json file — nothing is hardcoded for a
specific manufacturer.  A config file is created once (interactively, by
Claude in Step 0) and reused for the entire batch.

Parameter config entry (one per field)
---------------------------------------
{
  "key":      "imp_total",          # internal identifier
  "label":    "Impedance HV-(LV1+LV2) @ 4.6MVA (%)",  # Excel row label
  "pattern":  "Impedance HV to \\\\(LV1\\\\+LV2\\\\).*?\\\\(%\\\\)",  # regex
  "extract":  "two_nums",           # extraction method (see below)
  "unit":     "%",                  # unit string (informational)
  "critical": true,                 # missing value triggers WARNING flag
  "range":    [3.0, 20.0],          # [min, max] sanity check (omit to skip)
  "role":     "imp_total"           # engineering role (see ROLES below)
}

Extraction methods
------------------
  "two_nums"     Line contains <guarantee> <test>  — take the second number.
                 Used for impedances where guarantee precedes test result.
                 IMPORTANT: the pattern must extend past any unit/kVA token
                 between the label and the number pair so nums_after only
                 sees [guarantee, test].  E.g. extend with .*?\(%\).
  "last_num"     Take the last number on the matching line.
                 Used for losses (safe whether one or two values present).
  "first_num"    Take the first number after the pattern match.
  "slash_first"  Line contains "x / y"  — take x.
                 Useful for HV value in "HV / LV1 / LV2" nameplate lines.
  "slash_second" Line contains "x / y"  — take y.
  "text_after"   Extract the raw text after the pattern match (stripped).
                 Returns a string, not a float.  Used for date fields and
                 other non-numeric nameplate data.  No range check applied.

Engineering roles
-----------------
  "imp_total"   Z_H(LV1+LV2) at rated MVA   [used in T-equivalent, row 0]
  "imp_lv1"     Z_H-LV1 at split MVA        [row 1]
  "imp_lv2"     Z_H-LV2 at split MVA        [row 2]
  "imp_lv1lv2"  Z_L1-L2 measured            [row 3]
  "load_loss"   Load loss kW                [row 4]
  "no_load"     No-load loss kW             [row 5]
  "mag_curr"    Magnetising current %       [row 6]
  null / absent Informational only (no engineering calculation)
"""

import re, json, os
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# ══════════════════════════════════════════════════════════════════════════════
#  ENGINEERING ROLES — the 7 parameters needed for T-equivalent calculation
# ══════════════════════════════════════════════════════════════════════════════

REQUIRED_ROLES = ["imp_total", "imp_lv1", "imp_lv2",
                  "load_loss", "no_load", "mag_curr"]

# imp_lv1lv2 is optional — some manufacturers (e.g. Wilson Transformers) do not
# measure LV1-to-LV2 impedance in their routine test reports.  When absent the
# T-equivalent calculation still runs (it only needs imp_total/lv1/lv2) and the
# LV1-L2 comparison section is simply skipped rather than generating false flags.
OPTIONAL_ROLES = ["imp_lv1lv2"]

# Status display config
STATUS = {
    "OK":      {"label": "✓ OK",      "color": "375623", "bg": "E2EFDA"},
    "CAUTION": {"label": "⚠ CAUTION", "color": "7F5F00", "bg": "FFEB9C"},
    "WARNING": {"label": "⚠ WARNING", "color": "9C5700", "bg": "FFCC00"},
    "FAIL":    {"label": "✗ FAIL",    "color": "9C0006", "bg": "FFC7CE"},
    "MISSING": {"label": "— MISSING", "color": "595959", "bg": "D9D9D9"},
}


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIG  —  load / validate / save
# ══════════════════════════════════════════════════════════════════════════════

def load_config(config_path):
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)

    all_known = REQUIRED_ROLES + OPTIONAL_ROLES
    for p in cfg.get("parameters", []):
        if not p.get("role") and p.get("key") in all_known:
            p["role"] = p["key"]
    present_roles = {p.get("role") for p in cfg.get("parameters", [])}
    missing_roles = [r for r in REQUIRED_ROLES if r not in present_roles]
    if missing_roles:
        raise ValueError(
            f"Config is missing parameters for engineering roles: {missing_roles}\n"
            f"Required: {REQUIRED_ROLES}\n"
            f"Optional (can be absent): {OPTIONAL_ROLES}")

    cfg["missing_optional"] = [r for r in OPTIONAL_ROLES if r not in present_roles]
    return cfg


def save_config(cfg, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def roles_to_indices(params):
    return {p["role"]: i for i, p in enumerate(params) if p.get("role")}
