# Lance tous les microservices RH-Commission
# Usage: .\start-all.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$services = @(
    @{ Name = "service-auth";       Delay = 15 },
    @{ Name = "service-personnel";  Delay = 5  },
    @{ Name = "service-commission"; Delay = 5  },
    @{ Name = "service-presence";   Delay = 5  },
    @{ Name = "api-gateway";        Delay = 0  }
)

Write-Host "=== Demarrage microservices RH-Commission ===" -ForegroundColor Cyan

foreach ($svc in $services) {
    $path = Join-Path $root $svc.Name
    if (-not (Test-Path $path)) {
        Write-Host "[SKIP] $($svc.Name) introuvable: $path" -ForegroundColor Yellow
        continue
    }

    Write-Host "[START] $($svc.Name)" -ForegroundColor Green
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle='$($svc.Name)'; cd '$path'; mvn spring-boot:run"
    )

    if ($svc.Delay -gt 0) {
        Write-Host "       attente $($svc.Delay)s avant suivant..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $svc.Delay
    }
}

Write-Host "`n=== Tous services lances ===" -ForegroundColor Cyan
Write-Host "Stop tout: Get-Process java | Stop-Process -Force" -ForegroundColor DarkGray
