param(
  [string]$DesktopPath = "$env:USERPROFILE\Desktop",
  [string]$ProjectRoot = 'C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07 - HUB NETTURBO'
)

$batPath = Join-Path $DesktopPath 'Netturbo-Hub-WA.bat'
$content = @"
@echo off
setlocal
set "PROJECT_ROOT=$ProjectRoot"

start "Netturbo Hub" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%PROJECT_ROOT%'; npm run dev"
timeout /t 4 /nobreak >nul
start "Netturbo WA Bridge" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%PROJECT_ROOT%'; npm run wa-bridge"
timeout /t 4 /nobreak >nul
start "" "http://localhost:4000/dashboard/comunicacao"

endlocal
"@

Set-Content -Path $batPath -Value $content -Encoding ASCII
Write-Host "Created: $batPath"
