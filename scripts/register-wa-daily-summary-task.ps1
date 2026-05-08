param(
  [string]$TaskName = 'Netturbo WA Daily Summary',
  [string]$Time = '23:55',
  [string]$ProjectRoot = 'C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07 - HUB NETTURBO',
  [string]$DateMode = 'today'
)

$scriptPath = Join-Path $ProjectRoot 'scripts\run-wa-daily-summary.ps1'
$arguments = @(
  '-NoProfile',
  '-WindowStyle', 'Hidden',
  '-ExecutionPolicy', 'Bypass',
  '-File', "`"$scriptPath`""
)

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ($arguments -join ' ')
$trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::ParseExact($Time, 'HH:mm', $null))

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Description 'Gera o resumo diario do modulo WhatsApp IA do Netturbo Hub.' -Force

Write-Host "Scheduled task registered: $TaskName at $Time"
Write-Host "The task calls: $scriptPath"
Write-Host "Project root: $ProjectRoot"
