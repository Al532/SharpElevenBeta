param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $repoRoot 'mobile'
$androidHome = 'C:\Users\Alcibiade\AppData\Local\Android\Sdk'
$javaHome = 'C:\Program Files\Android\Android Studio\jbr'
$adbPath = Join-Path $androidHome 'platform-tools\adb.exe'
$capCliPath = Join-Path $mobileRoot 'node_modules\.bin\cap.cmd'
$androidConfigPath = Join-Path $mobileRoot 'android\app\src\main\assets\capacitor.config.json'

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-AndroidTargets {
    if (-not (Test-Path $adbPath)) {
        return @()
    }

    $lines = & $adbPath devices -l 2>&1
    $targets = @()

    foreach ($line in $lines) {
        if (-not $line -or $line -match '^List of devices attached' -or $line -match '^\* daemon ') {
            continue
        }

        $trimmed = $line.Trim()
        if (-not $trimmed) {
            continue
        }

        $parts = $trimmed -split '\s+'
        if ($parts.Count -lt 2 -or $parts[1] -ne 'device') {
            continue
        }

        $targets += [pscustomobject]@{
            Serial = $parts[0]
            Raw = $trimmed
        }
    }

    return $targets
}

function Select-AndroidTarget {
    param([object[]]$Targets)

    if ($Targets.Count -eq 0) {
        return $null
    }

    if ($Targets.Count -eq 1) {
        return $Targets[0]
    }

    Write-Step "Choix de l'appareil Android"
    for ($index = 0; $index -lt $Targets.Count; $index++) {
        Write-Host ("[{0}] {1}" -f ($index + 1), $Targets[$index].Raw)
    }

    if ($DryRun) {
        Write-Host "[dry-run] selection automatique: 1"
        return $Targets[0]
    }

    while ($true) {
        $choice = Read-Host "Choisis un appareil (1-$($Targets.Count))"
        $selectedIndex = 0
        if ([int]::TryParse($choice, [ref]$selectedIndex) -and $selectedIndex -ge 1 -and $selectedIndex -le $Targets.Count) {
            return $Targets[$selectedIndex - 1]
        }

        Write-Host "Choix invalide. Entre un nombre entre 1 et $($Targets.Count)." -ForegroundColor Yellow
    }
}

function Assert-LocalCapacitorConfig {
    if (-not (Test-Path $androidConfigPath)) {
        throw "Config Android Capacitor introuvable: $androidConfigPath"
    }

    $config = Get-Content $androidConfigPath -Raw | ConvertFrom-Json
    if ($config.server -and $config.server.url) {
        throw "La config Android contient encore server.url=$($config.server.url). Relance npm run mobile:copy puis reessaie."
    }
}

try {
    Write-Step "Recopie du bundle local Capacitor"
    if ($DryRun) {
        Write-Host "[dry-run] npm --prefix mobile run copy"
    } else {
        Push-Location $repoRoot
        try {
            npm --prefix mobile run copy
        } finally {
            Pop-Location
        }
    }

    Write-Step "Verification de la config locale"
    Assert-LocalCapacitorConfig
    Write-Host "OK: aucun server.url live-reload dans $androidConfigPath"

    $targets = Get-AndroidTargets
    $target = Select-AndroidTarget -Targets $targets
    if (-not $target) {
        Write-Host ""
        Write-Host "Aucun appareil Android connecte. Le projet natif est revenu en config locale; reconnecte le telephone puis relance cette commande pour reinstaller l'app." -ForegroundColor Yellow
        exit 0
    }

    Write-Step "Reinstallation de l'app Android en mode local"
    Write-Host "Cible: $($target.Serial)"
    $args = @('run', 'android', '--target', $target.Serial)
    Write-Host "$capCliPath $($args -join ' ')"

    if ($DryRun) {
        Write-Host '[dry-run] reinstallation Android sautee.'
        exit 0
    }

    if (-not (Test-Path $capCliPath)) {
        throw "CLI Capacitor introuvable: $capCliPath"
    }

    Push-Location $mobileRoot
    try {
        $env:JAVA_HOME = $javaHome
        $env:ANDROID_HOME = $androidHome
        $env:ANDROID_SDK_ROOT = $androidHome
        $env:Path = "$javaHome\bin;$androidHome\platform-tools;$env:Path"
        & $capCliPath @args
    } finally {
        Pop-Location
    }
} catch {
    Write-Host ""
    Write-Host "Echec du retour local: $($_.Exception.Message)" -ForegroundColor Red

    $details = $_ | Out-String
    if ($details.Trim()) {
        Write-Host $details.Trim()
    }

    exit 1
}
