# Vercel Environment Variables Setup Guide

## Quick Check

Visit your deployed site's diagnostic endpoint:
```
https://your-site.vercel.app/api/diagnose
```

This will show you:
- ✅ If environment variables are set
- ✅ If database connection works
- ✅ How many restaurants are accessible
- ✅ Any errors or recommendations

## Required Environment Variables

You need these 2 variables in Vercel:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Example**: `https://sunbwzzmnaudvmpohpyj.supabase.co`
- **Must start with**: `https://`

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Important**: Use the `anon` key, NOT the `service_role` key
- **Format**: Should be a single JWT token (long string starting with `eyJ...`)

## How to Set in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Production, Preview, Development (select all)
5. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Redeploy** your site after adding variables

## Common Issues

### Issue: "Invalid API key"
- **Cause**: Wrong key or malformed key
- **Fix**: Copy the `anon` key from Supabase (not `service_role`)
- **Check**: The key should be one continuous string, not two tokens

### Issue: "No restaurants found"
- **Cause**: Environment variables not set in Vercel
- **Fix**: Add variables in Vercel and redeploy

### Issue: "RLS policy violation"
- **Cause**: Row Level Security blocking access
- **Fix**: Check Supabase RLS policies for `restaurants_with_rating` view

## Verification Steps

1. **Check diagnostic endpoint**: `/api/diagnose`
2. **Test API directly**: `/api/restaurants/search`
3. **Check Vercel logs**: Look for errors during build/runtime
4. **Verify in Supabase**: Run `npm run list:restaurants` locally

## Your Current Values (from .env.local)

⚠️ **Note**: Your local `.env.local` anon key appears malformed (two tokens concatenated).

**Correct format**: Should be a single JWT token like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bmJ3enptbmF1ZHZtcG9ocHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzE0NzMsImV4cCI6MjA4NDg0NzQ3M30.yDGIcsvVG_t254lHUq8McAPDoPpoYhiHb5XOIFj6P_
```

**Your current value** (appears to have two tokens):
```
.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bmJ3enptbmF1ZHZtcG9ocHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzE0NzMsImV4cCI6MjA4NDg0NzQ3M30.yDGIcsvVG_t254lHUq8McAPDoPpoYhiHb5XOIFj6P_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9k
```

## Quick Fix

1. Go to Supabase Dashboard → Settings → API
2. Copy the **anon public** key (should be one long string)
3. Update in Vercel environment variables
4. Redeploy
