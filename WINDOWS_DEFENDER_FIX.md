# Fixing Windows Defender Issues with TreeScopeAI

If Windows Defender is detecting TreeScopeAI as a threat and deleting files, you can use one of these methods to resolve the issue:

## Method 1: Run the Automatic Fix Tool (Recommended)

1. After installation, find the `Add_Windows_Defender_Exclusion.bat` file in the installation directory
2. Right-click on this file and select "Run as administrator"
3. Follow the prompts in the window that appears
4. Once completed, TreeScopeAI should run without being blocked

## Method 2: Add Exclusion Manually

If the automatic tool doesn't work, you can add the exclusion manually:

1. Open Windows Security (type "Windows Security" in the Start menu)
2. Click on "Virus & threat protection"
3. Under "Virus & threat protection settings", click "Manage settings"
4. Scroll down to "Exclusions" and click "Add or remove exclusions"
5. Click "Add an exclusion" → "Folder"
6. Browse to the TreeScopeAI installation folder (typically `C:\Users\[YourUsername]\AppData\Local\Programs\TreeScopeAI`)
7. Click "Select Folder"
8. Repeat steps 5-7 for the data folder: `C:\Users\[YourUsername]\AppData\Roaming\TreeScopeAI`

## Method 3: Temporarily Disable Real-time Protection

If you're just installing the application:

1. Open Windows Security
2. Click on "Virus & threat protection"
3. Under "Virus & threat protection settings", click "Manage settings"
4. Temporarily turn off "Real-time protection"
5. Install TreeScopeAI
6. Turn real-time protection back on
7. Add exclusions as described in Method 2

## Why Does This Happen?

Windows Defender sometimes flags applications as malicious based on:

1. Use of AI technologies that may trigger heuristic detection
2. New software without widespread adoption
3. Certain file access patterns that resemble malware behavior

This is a false positive - TreeScopeAI is not a virus or malware. The methods above help Windows Defender recognize our app as safe.

## Still Having Problems?

If you're still experiencing issues, please:

1. Contact our support team at support@treescopeai.com
2. Include details about your Windows version and any error messages
3. We can provide you with an alternative installation method if needed

We apologize for the inconvenience and are working to obtain proper code signing certificates to prevent this issue in future releases. 