# Deploying to GitHub Pages

This guide will help you deploy the Whistler Winter Weather app to GitHub Pages.

## Method 1: Deploy from Main Branch (Recommended)

### Step 1: Merge to Main Branch

You have two options:

**Option A: Via Pull Request (Recommended)**
1. Go to your GitHub repository: https://github.com/brentbebuilding/outside
2. Click "Pull requests" → "New pull request"
3. Set base branch to `main` (or `master`)
4. Set compare branch to `claude/whistler-winter-weather-app-011CUMMCkGBErUrw1dumHHg1`
5. Click "Create pull request"
6. Review and merge the PR

**Option B: Via Command Line**
```bash
# Fetch the latest changes
git fetch origin

# Create/checkout main branch
git checkout -b main claude/whistler-winter-weather-app-011CUMMCkGBErUrw1dumHHg1

# Push to main (you may need appropriate permissions)
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Scroll down to **Pages** section (left sidebar under "Code and automation")
4. Under "Source", select:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or `master`)
   - **Folder**: `/ (root)`
5. Click **Save**

### Step 3: Wait for Deployment

- GitHub will build and deploy your site (usually takes 1-5 minutes)
- You'll see a message: "Your site is ready to be published at..."
- Once complete, visit: `https://brentbebuilding.github.io/outside/`

## Method 2: Deploy from Feature Branch (Alternative)

If you want to deploy directly from the current feature branch without merging:

### Step 1: Enable GitHub Pages from Feature Branch

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `claude/whistler-winter-weather-app-011CUMMCkGBErUrw1dumHHg1`
   - **Folder**: `/ (root)`
4. Click **Save**

Your site will be available at: `https://brentbebuilding.github.io/outside/`

## Method 3: Using gh-pages Branch (Advanced)

If you want a dedicated deployment branch:

```bash
# Install gh-pages package (optional, for automation)
npm install -g gh-pages

# Or manually create gh-pages branch
git checkout -b gh-pages
git push origin gh-pages

# Then in GitHub Settings → Pages, select gh-pages branch
```

## Verifying Deployment

After enabling GitHub Pages:

1. Check the **Actions** tab to see the deployment workflow
2. Once complete, visit your URL: `https://brentbebuilding.github.io/outside/`
3. The weather app should load and start fetching data immediately

## Custom Domain (Optional)

To use a custom domain:

1. In GitHub Settings → Pages
2. Add your custom domain under "Custom domain"
3. Update your DNS records:
   - Add a CNAME record pointing to `brentbebuilding.github.io`
   - Or A records pointing to GitHub's IPs

## Troubleshooting

### Site not loading?
- Check GitHub Actions tab for build errors
- Ensure the branch/folder settings are correct
- Wait a few minutes - first deployment can take time

### API errors?
- The Open-Meteo API should work from GitHub Pages
- Check browser console for CORS or network errors
- Ensure you're using HTTPS (GitHub Pages provides this automatically)

### 404 Error?
- Verify the repository name is correct in the URL
- Check if GitHub Pages is enabled in Settings
- Confirm the correct branch is selected

## Performance Notes

- GitHub Pages uses a CDN for fast global delivery
- The app is completely static (no server needed)
- Open-Meteo API calls happen client-side
- Page loads are very fast due to minimal dependencies

## Updating the Site

After making changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin <your-branch>

# If using main branch, merge PR or push to main
# GitHub Pages will automatically redeploy
```

## Notes

- GitHub Pages is **free** for public repositories
- HTTPS is automatically enabled
- The app works great on mobile devices
- No build process needed - deploy as-is!

---

**Your weather app will be live at:** `https://brentbebuilding.github.io/outside/`

Enjoy tracking Whistler's powder conditions! 🏂❄️
