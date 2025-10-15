# Fix MongoDB Configuration - Run as Administrator
# This script removes the replica set configuration that's causing connection timeouts

Write-Host "MongoDB Configuration Fix Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Find MongoDB config file
$configPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"

if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: MongoDB config file not found at: $configPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found MongoDB config at: $configPath" -ForegroundColor Green
Write-Host ""

# Backup the original config
$backupPath = "$configPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup at: $backupPath" -ForegroundColor Yellow
Copy-Item $configPath $backupPath
Write-Host "Backup created successfully!" -ForegroundColor Green
Write-Host ""

# Stop MongoDB service
Write-Host "Stopping MongoDB service..." -ForegroundColor Yellow
Stop-Service MongoDB -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "MongoDB service stopped" -ForegroundColor Green
Write-Host ""

# Read current config
$config = Get-Content $configPath

# Remove replica set lines
Write-Host "Removing replica set configuration..." -ForegroundColor Yellow
$newConfig = $config | Where-Object { 
    $_ -notmatch 'replSetName' -and 
    ($_ -notmatch '^replication:' -or $_ -match '#replication:')
}

# Write new config
$newConfig | Set-Content $configPath -Force
Write-Host "Configuration updated!" -ForegroundColor Green
Write-Host ""

# Start MongoDB service
Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
Start-Service MongoDB
Start-Sleep -Seconds 3
Write-Host "MongoDB service started" -ForegroundColor Green
Write-Host ""

# Check service status
$service = Get-Service MongoDB
if ($service.Status -eq 'Running') {
    Write-Host "SUCCESS! MongoDB is now running without replica set configuration" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now connect using:" -ForegroundColor Cyan
    Write-Host "  mongodb://localhost:27017" -ForegroundColor White
    Write-Host ""
    Write-Host "Test the connection by running:" -ForegroundColor Cyan
    Write-Host "  node test-db-connection.js" -ForegroundColor White
} else {
    Write-Host "WARNING: MongoDB service is not running" -ForegroundColor Red
    Write-Host "Service Status: $($service.Status)" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
