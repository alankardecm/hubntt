param(
  [string]$ProjectRoot = 'C:\Users\alan.moreira\Documents\00 - 2026\15 - PROJETO IA NETTURBO\07 - HUB NETTURBO',
  [string]$Date,
  [string]$Group,
  [string]$GroupId
)

Set-Location $ProjectRoot

if (-not $Date) {
  $Date = Get-Date -Format 'yyyy-MM-dd'
}

$args = @('--date=' + $Date)
if ($Group) {
  $args += '--group=' + $Group
}
if ($GroupId) {
  $args += '--group_id=' + $GroupId
}

npm run wa-daily-summary -- $args
