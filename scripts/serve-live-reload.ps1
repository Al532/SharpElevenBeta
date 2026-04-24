param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$devServerPort = 5173
$devServerUrl = "http://localhost:$devServerPort/"
$appId = 'io.github.al532.sharpelevenapp'
$javaHome = 'C:\Program Files\Android\Android Studio\jbr'
$androidHome = 'C:\Users\Alcibiade\AppData\Local\Android\Sdk'
$adbPath = Join-Path $androidHome 'platform-tools\adb.exe'
$emulatorPath = Join-Path $androidHome 'emulator\emulator.exe'
$capCliPath = Join-Path $repoRoot 'mobile\node_modules\.bin\cap.cmd'
$runtimeDir = Join-Path $repoRoot '.codex-runtime\android-live'
$wifiTargetCachePath = Join-Path $runtimeDir 'adb-wifi-target.txt'

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-CommandAvailable {
    param([string]$CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Get-PreferredIPv4Address {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notmatch '^127\.' -and
            $_.IPAddress -notmatch '^169\.254\.' -and
            $_.PrefixOrigin -ne 'WellKnown'
        }

    $defaultRoute = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
        Sort-Object RouteMetric, InterfaceMetric |
        Select-Object -First 1

    if ($defaultRoute) {
        $preferred = $candidates |
            Where-Object { $_.InterfaceIndex -eq $defaultRoute.InterfaceIndex } |
            Select-Object -First 1
        if ($preferred) {
            return $preferred.IPAddress
        }
    }

    return ($candidates | Select-Object -First 1).IPAddress
}

function Get-AndroidTargets {
    if (-not (Test-Path $adbPath)) {
        return @()
    }

    $lines = & $adbPath devices -l 2>$null
    $targets = @()

    foreach ($line in $lines) {
        if (-not $line -or $line -match '^List of devices attached') {
            continue
        }

        $trimmed = $line.Trim()
        if (-not $trimmed) {
            continue
        }

        $serial = ($trimmed -split '\s+')[0]
        $state = ($trimmed -split '\s+')[1]
        if ($state -ne 'device') {
            continue
        }

        $kind = 'usb'
        if ($serial -like 'emulator-*') {
            $kind = 'emulator'
        } elseif ($serial -match '^\d+\.\d+\.\d+\.\d+:\d+$') {
            $kind = 'wifi'
        }

        $targets += [pscustomobject]@{
            Serial = $serial
            Kind = $kind
            Raw = $trimmed
        }
    }

    return $targets
}

function Save-WifiTarget {
    param([string]$Serial)

    if (-not $Serial -or $Serial -notmatch '^\d+\.\d+\.\d+\.\d+:\d+$') {
        return
    }

    if ($DryRun) {
        Write-Host "[dry-run] memorisation ADB Wi-Fi: $Serial"
        return
    }

    New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    Set-Content -Path $wifiTargetCachePath -Value $Serial -Encoding ascii
}

function Get-CachedWifiTarget {
    if (-not (Test-Path $wifiTargetCachePath)) {
        return $null
    }

    $value = (Get-Content $wifiTargetCachePath -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if ($value -match '^\d+\.\d+\.\d+\.\d+:\d+$') {
        return $value
    }

    return $null
}

function Test-TcpEndpoint {
    param(
        [string]$HostName,
        [int]$Port,
        [int]$TimeoutMilliseconds = 250
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $result = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne($TimeoutMilliseconds, $false)) {
            return $false
        }

        $client.EndConnect($result) | Out-Null
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Get-WifiReconnectCandidates {
    param([string]$LocalWifiHost)

    $candidates = [System.Collections.Generic.List[string]]::new()
    $cachedTarget = Get-CachedWifiTarget
    if ($cachedTarget) {
        $candidates.Add($cachedTarget)
    }

    $neighborIps = Get-NetNeighbor -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -match '^\d+\.\d+\.\d+\.\d+$' -and
            $_.IPAddress -ne $LocalWifiHost -and
            $_.IPAddress -notmatch '^127\.' -and
            $_.IPAddress -notmatch '^169\.254\.' -and
            $_.State -in @('Reachable', 'Stale', 'Delay', 'Probe', 'Permanent')
        } |
        Select-Object -ExpandProperty IPAddress -Unique

    foreach ($neighborIp in $neighborIps) {
        $candidates.Add("$neighborIp`:5555")
    }

    return $candidates | Select-Object -Unique
}

function Connect-AdbWifiTarget {
    param([string]$Serial)

    if (-not $Serial -or $Serial -notmatch '^\d+\.\d+\.\d+\.\d+:\d+$') {
        return $null
    }

    $parts = $Serial.Split(':')
    $hostName = $parts[0]
    $port = [int]$parts[1]

    if (-not $DryRun -and -not (Test-TcpEndpoint -HostName $hostName -Port $port)) {
        return $null
    }

    Write-Host "Tentative ADB Wi-Fi sur $Serial"
    if ($DryRun) {
        Write-Host "[dry-run] adb connect $Serial"
        return [pscustomobject]@{
            Serial = $Serial
            Kind = 'wifi'
            Raw = $Serial
        }
    }

    $connectOutput = & $adbPath connect $Serial 2>&1
    $connectText = ($connectOutput | Out-String).Trim()
    if ($connectText) {
        Write-Host $connectText
    }

    $target = Get-AndroidTargets | Where-Object { $_.Serial -eq $Serial } | Select-Object -First 1
    if ($target) {
        Save-WifiTarget -Serial $target.Serial
        return $target
    }

    return $null
}

function Find-OrConnectWifiTarget {
    param([string]$LocalWifiHost)

    $existing = Get-AndroidTargets | Where-Object { $_.Kind -eq 'wifi' } | Select-Object -First 1
    if ($existing) {
        Save-WifiTarget -Serial $existing.Serial
        return $existing
    }

    $candidates = Get-WifiReconnectCandidates -LocalWifiHost $LocalWifiHost
    foreach ($candidate in $candidates) {
        $target = Connect-AdbWifiTarget -Serial $candidate
        if ($target) {
            return $target
        }
    }

    return $null
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($connection) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }

    return $false
}

function Start-BackgroundPowerShell {
    param(
        [string]$Title,
        [string]$Command
    )

    $escapedRoot = $repoRoot.Replace("'", "''")
    $escapedTitle = $Title.Replace("'", "''")
    $escapedCommand = $Command.Replace("'", "''")
    $psCommand = @"
$host.UI.RawUI.WindowTitle = '$escapedTitle'
Set-Location '$escapedRoot'
$env:JAVA_HOME = '$javaHome'
$env:ANDROID_HOME = '$androidHome'
$env:ANDROID_SDK_ROOT = '$androidHome'
$env:Path = '$javaHome\bin;$androidHome\platform-tools;' + $env:Path
$escapedCommand
"@

    if ($DryRun) {
        Write-Host "[dry-run] powershell -NoExit -Command $Command"
        return $null
    }

    return Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $psCommand
    ) -PassThru
}

function Start-DevServer {
    $listener = Get-NetTCPConnection -LocalPort $devServerPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        Write-Host "Le serveur Vite est deja a l'ecoute sur le port $devServerPort."
        return
    }

    Write-Step "Demarrage du serveur Vite live-reload"
    Start-BackgroundPowerShell -Title 'SharpEleven Vite Live Reload' -Command 'npm run dev:android:web'
    if ($DryRun) {
        return
    }
    if (-not (Wait-ForPort -Port $devServerPort -TimeoutSeconds 30)) {
        throw "Le serveur Vite n'a pas demarre sur le port $devServerPort."
    }
}

function Open-LocalBrowser {
    Write-Step "Ouverture du navigateur local"
    Write-Host "URL locale: $devServerUrl"

    if ($DryRun) {
        Write-Host "[dry-run] Start-Process $devServerUrl"
        return
    }

    Start-Process $devServerUrl | Out-Null
}

function Get-AvailableAvd {
    if (-not (Test-Path $emulatorPath)) {
        return @()
    }

    $avds = & $emulatorPath -list-avds 2>$null
    return @($avds | Where-Object { $_ -and $_.Trim() })
}

function Wait-ForAndroidTarget {
    param(
        [string]$PreferredKind,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $target = Get-AndroidTargets | Where-Object { $_.Kind -eq $PreferredKind } | Select-Object -First 1
        if ($target) {
            return $target
        }
        Start-Sleep -Seconds 2
    }

    return $null
}

function Start-AndroidEmulatorIfPossible {
    $existing = Get-AndroidTargets | Where-Object { $_.Kind -eq 'emulator' } | Select-Object -First 1
    if ($existing) {
        Write-Host "Emulateur deja connecte: $($existing.Serial)"
        return $existing
    }

    $avds = Get-AvailableAvd
    if (-not $avds.Count) {
        Write-Host "Aucun emulateur Android configure detecte."
        return $null
    }

    $selectedAvd = $avds[0]
    Write-Step "Demarrage de l'emulateur Android $selectedAvd"

    if ($DryRun) {
        Write-Host "[dry-run] $emulatorPath -avd $selectedAvd"
        return [pscustomobject]@{
            Serial = 'emulator-dry-run'
            Kind = 'emulator'
            Raw = $selectedAvd
        }
    }

    Start-Process $emulatorPath -ArgumentList @('-avd', $selectedAvd) | Out-Null
    return Wait-ForAndroidTarget -PreferredKind 'emulator' -TimeoutSeconds 120
}

function Invoke-CapRun {
    param(
        [string]$HostName,
        [string]$TargetSerial,
        [switch]$ForwardPorts
    )

    $args = @(
        'run', 'android',
        '--target', $TargetSerial,
        '--live-reload',
        '--host', $HostName,
        '--port', $devServerPort
    )

    if ($ForwardPorts) {
        $args += @('--forwardPorts', "$devServerPort`:$devServerPort")
    }

    $display = "$capCliPath $($args -join ' ')"
    Write-Host $display

    if ($DryRun) {
        Write-Host '[dry-run] lancement Android saute.'
        return
    }

    if (-not (Test-Path $capCliPath)) {
        throw "CLI Capacitor introuvable: $capCliPath"
    }

    Push-Location (Join-Path $repoRoot 'mobile')
    try {
        $env:JAVA_HOME = $javaHome
        $env:ANDROID_HOME = $androidHome
        $env:ANDROID_SDK_ROOT = $androidHome
        $env:Path = "$javaHome\bin;$androidHome\platform-tools;$env:Path"
        & $capCliPath @args
    } finally {
        Pop-Location
    }
}

function Start-AndroidLiveReload {
    param([string]$WifiHost)

    $targets = Get-AndroidTargets
    $usbTarget = $targets | Where-Object { $_.Kind -eq 'usb' } | Select-Object -First 1
    if ($usbTarget) {
        Write-Step "Lancement de l'app Android sur telephone cable"
        Write-Host "Appareil USB detecte: $($usbTarget.Serial)"
        Invoke-CapRun -HostName 'localhost' -TargetSerial $usbTarget.Serial -ForwardPorts
        return
    }

    $wifiTarget = Find-OrConnectWifiTarget -LocalWifiHost $WifiHost
    if ($wifiTarget -and $WifiHost) {
        Write-Step "Lancement de l'app Android sur appareil Wi-Fi ADB"
        Write-Host "Appareil Wi-Fi detecte: $($wifiTarget.Serial)"
        Save-WifiTarget -Serial $wifiTarget.Serial
        Invoke-CapRun -HostName $WifiHost -TargetSerial $wifiTarget.Serial
        return
    }

    $emulatorTarget = Start-AndroidEmulatorIfPossible
    if ($emulatorTarget) {
        Write-Step "Lancement de l'app Android sur emulateur"
        Write-Host "Cible emulateur: $($emulatorTarget.Serial)"
        Invoke-CapRun -HostName '10.0.2.2' -TargetSerial $emulatorTarget.Serial
        return
    }

    Write-Step "Aucune cible Android lancable automatiquement"
    Write-Host "Navigateur local ouvert sur $devServerUrl"
    if ($WifiHost) {
        Write-Host "Pour un telephone en Wi-Fi, ouvre $($WifiHost):$devServerPort dans le navigateur"
        Write-Host "Pour l'app Android en Wi-Fi, le telephone doit deja etre connecte a ADB over Wi-Fi."
    } else {
        Write-Host "Aucune IP reseau utilisable n'a ete detectee pour le mode Wi-Fi."
    }
}

Write-Step "Preparation du live-reload Sharp Eleven"

if (-not (Test-CommandAvailable -CommandName 'npm')) {
    throw 'npm est introuvable dans cette session.'
}

Start-DevServer
Open-LocalBrowser

$wifiIp = Get-PreferredIPv4Address
if ($wifiIp) {
    Write-Host "URL reseau: http://$wifiIp`:$devServerPort/"
} else {
    Write-Host "Aucune IP IPv4 reseau detectee."
}

Start-AndroidLiveReload -WifiHost $wifiIp

Write-Host ""
Write-Host "Live-reload pret. Laisse cette fenetre ouverte pendant le developpement." -ForegroundColor Green
