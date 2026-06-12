$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js was not found. Please install Node.js 20.9 or newer, then run this script again."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Write-Error "npm.cmd was not found. Please reinstall Node.js with npm enabled."
}

if (-not (Test-Path -LiteralPath "node_modules" -PathType Container)) {
  Write-Host "node_modules not found. Installing dependencies from package-lock.json..."
  & npm.cmd install
}

function Get-PortListenerProcessIds {
  param([int] $Port)

  return Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
}

if (-not $env:PORT) {
  $env:PORT = "3000"
}

$portNumber = [int]$env:PORT
$listenerProcessIds = @(Get-PortListenerProcessIds -Port $portNumber)

if ($listenerProcessIds.Count -gt 0) {
  Write-Host "Port $portNumber is already in use. Stopping existing process(es): $($listenerProcessIds -join ', ')"

  foreach ($processId in $listenerProcessIds) {
    Stop-Process -Id $processId -Force
  }

  $deadline = (Get-Date).AddSeconds(10)
  while (@(Get-PortListenerProcessIds -Port $portNumber).Count -gt 0) {
    if ((Get-Date) -gt $deadline) {
      Write-Error "Port $portNumber is still busy after stopping existing process(es)."
    }

    Start-Sleep -Milliseconds 250
  }
}

Write-Host "Starting lua-san-26 on http://localhost:$env:PORT"
& npm.cmd run dev -- --port $env:PORT
