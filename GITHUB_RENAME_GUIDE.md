# GitHub Repository Rename Guide

This guide explains how to rename the GitHub repository from `omega-one` to `head-north`.

## Current Status

- **Current Remote URL**: `https://github.com/kulo/omega-one.git`
- **Target Remote URL**: `https://github.com/kulo/head-north.git`
- **package.json**: Already updated to reference `head-north`

## Steps to Rename the Repository

### Step 1: Rename the Repository on GitHub

1. Go to your repository on GitHub: https://github.com/kulo/omega-one
2. Click on **Settings** (in the repository navigation bar)
3. Scroll down to the **Repository name** section
4. Change the name from `omega-one` to `head-north`
5. Click **Rename**

**Note**: GitHub will automatically redirect the old URL to the new one, but it's best to update your local remotes.

### Step 2: Update Local Git Remote URL

After renaming on GitHub, update your local git remote:

```bash
git remote set-url origin https://github.com/kulo/head-north.git
```

Verify the change:

```bash
git remote -v
```

### Step 3: Push to the Renamed Repository

Push your current `main` branch to the renamed repository:

```bash
git push origin main
```

If you have other branches you want to push:

```bash
git push origin --all
```

### Step 4: Update Default Branch (if needed)

If your default branch on GitHub is still something other than `main`, you may want to:

1. Go to GitHub repository Settings → Branches
2. Change the default branch to `main` if it isn't already

### Step 5: Clean Up Old Branch (Optional)

If you want to delete the old `rename-omega-to-head-north` branch:

**Local branch:**

```bash
git branch -d rename-omega-to-head-north
```

**Remote branch:**

```bash
git push origin --delete rename-omega-to-head-north
```

## Verification

After completing these steps, verify everything works:

1. Check remote URL:

   ```bash
   git remote -v
   ```

   Should show: `origin https://github.com/kulo/head-north.git`

2. Test push/pull:

   ```bash
   git fetch origin
   git status
   ```

3. Visit the new repository URL:
   https://github.com/kulo/head-north

## Important Notes

- **GitHub Redirects**: GitHub will automatically redirect `omega-one` URLs to `head-north` for a period of time, but you should update all references
- **CI/CD**: If you have any CI/CD pipelines, webhooks, or integrations, you'll need to update them with the new repository URL
- **Collaborators**: Notify any collaborators about the repository rename
- **Clones**: Anyone who has cloned the repository will need to update their remote URL:
  ```bash
  git remote set-url origin https://github.com/kulo/head-north.git
  ```

## Troubleshooting

If you encounter issues:

1. **Permission denied**: Make sure you have admin access to the repository
2. **Repository name already exists**: The name `head-north` might already be taken. Choose a different name or contact GitHub support
3. **Remote URL not updating**: Try removing and re-adding the remote:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/kulo/head-north.git
   ```

---

_Last updated: After merge to main_
