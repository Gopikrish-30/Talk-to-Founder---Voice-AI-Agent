This project has Vercel configuration added for deployments.

Next steps to deploy from GitHub:

1. Create a GitHub repository and push your local repo (or add a remote).

   ```bash
   git init
   git add .
   git commit -m "Add Vercel deploy config"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```

2. Add a `VERCEL_TOKEN` secret to your GitHub repository settings. Generate a personal token in Vercel (Account Settings → Tokens).

3. After pushing, the workflow `.github/workflows/deploy-vercel.yml` will run and deploy to Vercel.

Notes:
- You may prefer connecting the GitHub repo directly in the Vercel dashboard instead of using a token-based workflow.
- If you want the deploy action to target a specific Vercel project/org, add `--scope <org>` or set `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as secrets and pass them to the `vercel` command.
