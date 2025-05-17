# Deploying to Namecheap (www.sustify.me)

We've set up multiple ways to deploy this application to your Namecheap domain.

## Option 1: Automatic Deployment with GitHub Actions

The most convenient method is using the GitHub Actions workflow we've created.

### Setup:

1. Go to your GitHub repository settings
2. Click on "Secrets and variables" → "Actions"
3. Add the following secrets:
   - `FTP_SERVER`: ftp.sustify.me (or your Namecheap FTP server)
   - `FTP_USERNAME`: Your Namecheap FTP username
   - `FTP_PASSWORD`: Your Namecheap FTP password

### How it works:

- Every time you push to the master branch, GitHub will automatically:
  - Build your Vite application
  - Upload the build files to your Namecheap hosting

## Option 2: Manual Upload via FTP

1. Run `npm run build` locally to generate the `dist/` folder
2. Use an FTP client like FileZilla to connect to your Namecheap hosting
3. Upload the contents of the `dist/` folder to the `public_html/` directory on your server

## Option 3: Using the Deployment Script

1. Edit the `deploy-to-namecheap.sh` script with your FTP credentials
2. Make it executable: `chmod +x deploy-to-namecheap.sh`
3. Run the script: `./deploy-to-namecheap.sh`

## Important Files for Single-Page Applications

We've added the following files to make your SPA work correctly on Namecheap:

1. `.htaccess` - Handles URL routing for your SPA
2. `.nojekyll` - Prevents GitHub from processing your files with Jekyll

## Domain Setup

Ensure your domain (www.sustify.me) is properly pointed to your Namecheap hosting through the Namecheap DNS settings.

## Testing Your Deployment

After deployment, visit your site at www.sustify.me to ensure everything is working correctly. 