# Vercel Not Updating After Push

If your site on Vercel isn’t showing the latest changes after `git push`, try the following.

## 1. Check the latest deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Open your **AfriTable** project.
3. Open the **Deployments** tab.
4. Check the **top deployment**:
   - **Commit**: Does it show your latest commit (e.g. `e3d947b`)?
   - **Status**: Building, Ready, or Error?

- If the **latest commit isn’t there**, Vercel didn’t receive the push (see step 4).
- If the **latest deployment has status Error**, open it and read the **Build Logs** to fix the error.
- If the **latest deployment is Ready** but the site still looks old, try a **hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) or **redeploy** (step 3).

## 2. Trigger a redeploy from the dashboard

1. In your project, go to **Deployments**.
2. Click the **⋯** on the latest deployment.
3. Choose **Redeploy**.
4. Leave **Use existing Build Cache** unchecked if you want a clean build.
5. Confirm. Wait for the new deployment to finish and be promoted.

## 3. Deploy from the CLI (recommended)

If you have [Vercel CLI](https://vercel.com/docs/cli) installed:

```bash
cd /path/to/afritable
vercel --prod
```

This builds and deploys the current branch to production and usually fixes “not updating” when the dashboard isn’t redeploying.

Install CLI if needed:

```bash
npm i -g vercel
```

## 4. Confirm Git connection

1. In the project, go to **Settings** → **Git**.
2. Check:
   - **Connected repository** is the correct repo (e.g. `oobaretin/AfriTable`).
   - **Production Branch** is `main` (or whatever branch you push to).
3. If you recently changed the repo or branch, **Redeploy** once from the Deployments tab.

## 5. Clear cache and redeploy

Sometimes an old build or cache is used:

1. **Deployments** → **⋯** on latest → **Redeploy**.
2. Enable **Clear build cache and redeploy** (or equivalent) if the UI offers it.
3. Redeploy again.

---

**Quick check:** Your production build runs successfully locally (`npm run build`). If Vercel still doesn’t update, the cause is usually: no new deployment triggered, a failed build on Vercel, or browser/CDN cache. Use the steps above to trigger a new deploy and confirm the latest commit is built and live.
