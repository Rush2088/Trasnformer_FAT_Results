---
title: TX FAT UI — Vercel Deployment Guide
---

# Deploy to Vercel (free tier)

This is a React + Vite + Tailwind 4 SPA. Vercel detects Vite automatically.

---

## Step 1 — Create a GitHub repository

1. Go to https://github.com/new
2. Create a **private** repository named `transformer-fat-ui`
3. Do NOT initialise with a README (the folder already has files)

---

## Step 2 — Push the code

Open a terminal in the `transformer-fat-ui` folder and run:

```bash
cd "path/to/Transformer FAT/transformer-fat-ui"

git init
git add .
git commit -m "Initial commit — TX FAT UI"

git remote add origin https://github.com/YOUR_USERNAME/transformer-fat-ui.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Import into Vercel

1. Go to https://vercel.com and sign in (use your GitHub account)
2. Click **Add New → Project**
3. Select the `transformer-fat-ui` repository
4. Vercel auto-detects Vite — leave all settings as-is
5. Click **Deploy**

Vercel will build and deploy in ~30 seconds.
Your app URL will be something like `https://transformer-fat-ui.vercel.app`.

---

## Step 4 — Update CORS in the HF Space backend

Once you have your Vercel URL, add it to the CORS whitelist in your HF Space.

Open `app/main.py` in the `TX_FAT_Reports` Space and find:

```python
allow_origins=[
    "http://localhost:5173",
    "https://*.vercel.app",
],
```

If it's already using `https://*.vercel.app` (wildcard), you're done.
If it lists a specific URL, add your new URL and push.

---

## Step 5 — Verify the app

Open your Vercel URL in a browser. You should see:
- The navy top bar: **⚡ TX FAT**
- Step 0 — Config Builder with a PDF drag-and-drop zone
- Buttons: "Auto-detect parameters" and "Use saved config"

---

## Local development

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment variable (optional)

The API base URL is hardcoded in `src/utils/api.js`.
If you want to use an environment variable instead:

1. Add `VITE_API_BASE=https://rashmil888-tx-fat-reports.hf.space` to `.env.local`
2. Update `api.js` line 3 to:
   ```js
   export const API_BASE = import.meta.env.VITE_API_BASE || 'https://rashmil888-tx-fat-reports.hf.space'
   ```
3. In Vercel → Project Settings → Environment Variables, add `VITE_API_BASE`

This lets you point the UI at a different backend without changing code.
