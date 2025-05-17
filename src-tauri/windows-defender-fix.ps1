# Windows Defender Exclusion Setup for TreeScopeAI
# This script must be run with Administrator privileges

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator!"
    Read-Host "Press ENTER to exit"
    exit
}

# Application installation directory - default or specified
$defaultInstallDir = "$env:LOCALAPPDATA\Programs\TreeScopeAI"
$installDir = Read-Host "Enter TreeScopeAI installation directory (press Enter for default: $defaultInstallDir)"
if ([string]::IsNullOrWhiteSpace($installDir)) {
    $installDir = $defaultInstallDir
}

# Verify the installation directory exists
if (-NOT (Test-Path $installDir)) {
    Write-Warning "Installation directory does not exist: $installDir"
    $createDir = Read-Host "Would you like to create it? (y/n)"
    if ($createDir -eq "y") {
        New-Item -ItemType Directory -Path $installDir | Out-Null
    } else {
        Read-Host "Press ENTER to exit"
        exit
    }
}

Write-Host "Adding Windows Defender exclusions for TreeScopeAI..." -ForegroundColor Green

# Add folder exclusion
try {
    Add-MpPreference -ExclusionPath $installDir -ErrorAction Stop
    Write-Host "Successfully added folder exclusion: $installDir" -ForegroundColor Green
} catch {
    Write-Warning "Failed to add folder exclusion: $_"
}

# Add executable exclusion
$exePath = Join-Path $installDir "TreeScopeAI.exe"
try {
    Add-MpPreference -ExclusionProcess $exePath -ErrorAction Stop
    Write-Host "Successfully added process exclusion: $exePath" -ForegroundColor Green
} catch {
    Write-Warning "Failed to add process exclusion: $_"
}

# Add exclusion for data directory
$dataDir = "$env:APPDATA\TreeScopeAI"
try {
    Add-MpPreference -ExclusionPath $dataDir -ErrorAction Stop
    Write-Host "Successfully added data directory exclusion: $dataDir" -ForegroundColor Green
} catch {
    Write-Warning "Failed to add data directory exclusion: $_"
}

Write-Host "`nSetup complete. TreeScopeAI should now run without being blocked by Windows Defender." -ForegroundColor Green
Write-Host "If you're still experiencing issues, please consider:"
Write-Host "1. Running the app as administrator for the first time"
Write-Host "2. Temporarily disabling real-time protection to install"
Write-Host "3. Submitting the app to Microsoft for false positive review"
Write-Host "   https://www.microsoft.com/en-us/wdsi/filesubmission"

Read-Host "Press ENTER to exit" 