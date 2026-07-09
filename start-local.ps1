$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 5173

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "Set-Location -LiteralPath '$root'; python -m http.server $port"
  )
  Start-Sleep -Seconds 1
}

Start-Process "http://localhost:$port/"
