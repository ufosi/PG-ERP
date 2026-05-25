$ErrorActionPreference = "Stop"

$port = 3000
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  if (-not $processId) {
    continue
  }

  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    continue
  }

  $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue).CommandLine
  $isNode = $process.ProcessName -eq "node"
  $isProjectDevServer = $commandLine -like "*$projectRoot*" -and ($commandLine -like "*next*" -or $commandLine -like "*node_modules*")

  if ($isNode -and $isProjectDevServer) {
    Write-Host "Stopping stale dev server on port $port (PID $processId)..."
    Stop-Process -Id $processId -Force
  }
}

$nodePath = "C:\nvm4w\nodejs"
if (Test-Path $nodePath) {
  $env:PATH = "$nodePath;$env:PATH"
}

Write-Host "Starting Next.js dev server on http://localhost:$port ..."
& "$projectRoot\node_modules\.bin\next.cmd" dev
