#!/bin/bash

# Deploy script for Namecheap hosting
# Replace with your actual FTP credentials
FTP_USER="your-ftp-username"
FTP_PASS="your-ftp-password"
FTP_HOST="ftp.sustify.me"
REMOTE_DIR="/public_html/"  # Usually the public_html folder

# Build the application
echo "Building application..."
npm run build

# Upload the dist folder contents to Namecheap
echo "Uploading to $FTP_HOST..."

# Using lftp for better sync capabilities
# Install lftp if not already installed: 
# Windows: use WSL or install via Chocolatey
# Mac: brew install lftp
# Linux: apt install lftp or equivalent

lftp -c "
open $FTP_HOST
user $FTP_USER $FTP_PASS
mirror -R dist/ $REMOTE_DIR
bye
"

echo "Deployment completed!" 