# GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using Vite.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**

### 2. Repository Name Configuration

The project is configured to work with the repository name `officina-tracker`. If your repository has a different name, update the `base` property in `vite.config.js`:

```javascript
export default defineConfig({
  base: '/your-repository-name/', // Change this to match your repo name
  // ... rest of config
});
```

### 3. Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will automatically:

- Build the project when you push to the `main` branch
- Deploy the built files to GitHub Pages
- Handle all JSON data files and content properly

### 4. Manual Testing

You can test the build locally before deploying:

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 5. Access Your Deployed Site

Once deployed, your site will be available at:
`https://your-username.github.io/officina-tracker/`

## Build Process

The custom build script (`build.js`) ensures:

- ✅ Vite builds the optimized production files
- ✅ All JSON data files are copied to the dist folder
- ✅ Content files are preserved
- ✅ Proper directory structure is maintained

## Troubleshooting

If you encounter issues:

1. **Build fails**: Check the GitHub Actions logs for specific errors
2. **JSON files not loading**: Verify the `js/data` directory exists in the dist folder
3. **Base path issues**: Make sure the `base` in `vite.config.js` matches your repository name
4. **404 errors**: Ensure GitHub Pages is set to use GitHub Actions as the source

## Development Workflow

1. Make changes to your code
2. Test locally with `npm run dev`
3. Commit and push to `main` branch
4. GitHub Actions will automatically build and deploy
5. Your changes will be live in a few minutes