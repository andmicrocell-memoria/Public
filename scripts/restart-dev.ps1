$ErrorActionPreference = "SilentlyContinue"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$ports = @(3000, 24678)
foreach ($port in $ports) {
  $processIds = @(Get-NetTCPConnection -LocalPort $port | Select-Object -ExpandProperty OwningProcess -Unique)
  if ($processIds.Count -gt 0) {
    foreach ($processId in $processIds) {
      if ($processId -and $processId -ne $PID) {
        Write-Output "Killing PID $processId on port $port"
        Stop-Process -Id $processId -Force
      }
    }
  } else {
    Write-Output "Port $port already free"
  }
}

$ErrorActionPreference = "Continue"
Write-Output "Starting dev server..."
npm run dev
