# Set ANDROID_HOME and add SDK tools to PATH (User) for Expo / React Native
# Run once, then close and reopen your terminal (and Cursor) before running: npx expo start --android

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path $sdkPath)) {
    Write-Host "Android SDK not found at: $sdkPath" -ForegroundColor Yellow
    Write-Host "Install Android Studio first: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "Default SDK location is: $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Gray
    exit 1
}

[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkPath, "User")

$path = [Environment]::GetEnvironmentVariable("Path", "User")
$entries = @(
    "$sdkPath\platform-tools",
    "$sdkPath\emulator",
    "$sdkPath\tools"
)
$toAdd = $entries | Where-Object { $path -notlike "*$_*" }
if ($toAdd.Count -gt 0) {
    $newPath = ($path.TrimEnd(';') + ";" + ($toAdd -join ";")).TrimStart(';')
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added to PATH: $($toAdd -join ', ')" -ForegroundColor Green
} else {
    Write-Host "SDK paths already in PATH." -ForegroundColor Green
}

Write-Host ""
Write-Host "ANDROID_HOME = $sdkPath" -ForegroundColor Cyan
Write-Host "Close this terminal and Cursor, then reopen and run: npx expo start --android" -ForegroundColor Cyan
