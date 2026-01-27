# 🔧 FIX: Invalid Anon Key Issue

## Problem
Your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is invalid, which is why restaurants don't show on your site.

## Solution

### Step 1: Get the Correct Key from Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Under **Project API keys**, find the **`anon` `public`** key
5. Copy the entire key (it's a long JWT token starting with `eyJ...`)

### Step 2: Update in Vercel (CRITICAL - This is what your site uses)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Edit**
6. Paste the correct key from Supabase
7. Make sure it's set for **Production**, **Preview**, and **Development**
8. Click **Save**
9. **Redeploy** your site (or push a new commit to trigger deployment)

### Step 3: Update Locally (Optional - for local development)

Update your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_correct_key_here
```

## How to Verify

After updating Vercel and redeploying:

1. Visit: `https://your-site.vercel.app/api/diagnose`
   - Should show restaurants are accessible

2. Visit: `https://your-site.vercel.app/api/restaurants/search`
   - Should return JSON with all restaurants

3. Visit: `https://your-site.vercel.app/restaurants`
   - Should show all 65 restaurants

## Current Issue

Your local `.env.local` has a malformed key (appears to have two tokens concatenated). The correct format is a single JWT token like:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bmJ3enptbmF1ZHZtcG9ocHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzE0NzMsImV4cCI6MjA4NDg0NzQ3M30.yDGIcsvVG_t254lHUq8McAPDoPpoYhiHb5XOIFj6P_
```

## Quick Test

Run locally to verify the key works:
```bash
npm run diagnose
```

Should show:
- ✅ ADMIN: Found restaurants
- ✅ PUBLIC: Found restaurants (not ❌)
