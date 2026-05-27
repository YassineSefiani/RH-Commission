# Tue tous processus java (microservices)
# Usage: .\stop-all.ps1

Write-Host "Stop tous processus java..." -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Done." -ForegroundColor Green
