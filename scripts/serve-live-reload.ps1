param(
    [ValidateSet('menu', 'web-local', 'web-network', 'usb', 'wifi', 'emulator')]
    [string]$Target = 'menu',
    [string]$Serial,
    [switch]$ListTargets,
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
$logDir = Join-Path $repoRoot '.codex-live-reload-logs'

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
    param([switch]$IncludeNonReady)

    if (-not (Test-Path $adbPath)) {
        return @()
    }

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $lines = & $adbPath devices -l 2>&1
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $targets = @()

    foreach ($line in $lines) {
        if (-not $line -or $line -match '^List of devices attached' -or $line -match '^\* daemon ') {
            continue
        }

        $trimmed = $line.Trim()
        if (-not $trimmed) {
            continue
        }

        $serial = ($trimmed -split '\s+')[0]
        $state = ($trimmed -split '\s+')[1]
        if ($state -ne 'device' -and -not $IncludeNonReady) {
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
            State = $state
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
    $psCommand = @(
        "`$host.UI.RawUI.WindowTitle = '$escapedTitle'",
        "Set-Location '$escapedRoot'",
        "`$env:JAVA_HOME = '$javaHome'",
        "`$env:ANDROID_HOME = '$androidHome'",
        "`$env:ANDROID_SDK_ROOT = '$androidHome'",
        "`$env:Path = '$javaHome\bin;$androidHome\platform-tools;' + `$env:Path",
        $Command
    ) -join [Environment]::NewLine

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

function Start-HiddenPowerShell {
    param(
        [string]$Command
    )

    $escapedRoot = $repoRoot.Replace("'", "''")
    $psCommand = @(
        "Set-Location '$escapedRoot'",
        "`$env:JAVA_HOME = '$javaHome'",
        "`$env:ANDROID_HOME = '$androidHome'",
        "`$env:ANDROID_SDK_ROOT = '$androidHome'",
        "`$env:Path = '$javaHome\bin;$androidHome\platform-tools;' + `$env:Path",
        $Command
    ) -join [Environment]::NewLine

    if ($DryRun) {
        Write-Host "[dry-run] powershell -WindowStyle Hidden -Command $Command"
        return $null
    }

    return Start-Process powershell -WindowStyle Hidden -ArgumentList @(
        '-NoProfile',
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

function Start-AndroidLaunchWatchdog {
    param(
        [string]$TargetSerial,
        [string]$LogPath
    )

    $watchdogLogPath = [System.IO.Path]::ChangeExtension($LogPath, '.watchdog.log')
    $command = @(
        "`$deadline = (Get-Date).AddSeconds(120)",
        "`$ready = `$false",
        "while ((Get-Date) -lt `$deadline) {",
        "    if (Test-Path '$LogPath') {",
        "        `$text = Get-Content '$LogPath' -Raw -ErrorAction SilentlyContinue",
        "        if (`$text -match 'App running with live reload') { `$ready = `$true; break }",
        "        if (`$text -match 'Capacitor a echoue|FAILURE: Build failed|Error:') { break }",
        "    }",
        "    Start-Sleep -Seconds 1",
        "}",
        "if (`$ready) {",
        "    `$pidText = & '$adbPath' -s '$TargetSerial' shell pidof '$appId' 2>`$null",
        "    if (-not `$pidText) {",
        "        Add-Content -Path '$watchdogLogPath' -Value `"`$(Get-Date -Format o) App absente apres deploy, lancement ADB explicite.`"",
        "        & '$adbPath' -s '$TargetSerial' shell monkey -p '$appId' -c android.intent.category.LAUNCHER 1 >> '$watchdogLogPath' 2>&1",
        "    } else {",
        "        Add-Content -Path '$watchdogLogPath' -Value `"`$(Get-Date -Format o) App deja lancee: `$pidText`"",
        "    }",
        "} else {",
        "    Add-Content -Path '$watchdogLogPath' -Value `"`$(Get-Date -Format o) Capacitor pas pret avant timeout ou erreur.`"",
        "}"
    ) -join [Environment]::NewLine

    Start-HiddenPowerShell -Command $command | Out-Null
    Write-Host "Watchdog lancement Android: $watchdogLogPath"
}

function Get-AvailableAvd {
    if (-not (Test-Path $emulatorPath)) {
        return @()
    }

    $avds = & $emulatorPath -list-avds 2>$null
    return ,@($avds | Where-Object { $_ -and $_.Trim() })
}

function Wait-ForAndroidTarget {
    param(
        [string]$PreferredKind,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastReconnectAttempt = Get-Date 0
    while ((Get-Date) -lt $deadline) {
        $target = Get-AndroidTargets | Where-Object { $_.Kind -eq $PreferredKind } | Select-Object -First 1
        if ($target) {
            if ($PreferredKind -ne 'emulator' -or $DryRun) {
                return $target
            }

            $bootCompleted = (& $adbPath -s $target.Serial shell getprop sys.boot_completed 2>$null | Select-Object -First 1).Trim()
            if ($bootCompleted -eq '1') {
                return $target
            }
        }

        $offlineTarget = Get-AndroidTargets -IncludeNonReady |
            Where-Object { $_.Kind -eq $PreferredKind -and $_.State -eq 'offline' } |
            Select-Object -First 1
        if ($offlineTarget -and ((Get-Date) - $lastReconnectAttempt).TotalSeconds -ge 12) {
            $lastReconnectAttempt = Get-Date
            Write-Host "Emulateur ADB offline, tentative de reconnexion: $($offlineTarget.Serial)"
            if (-not $DryRun) {
                & $adbPath reconnect offline 2>$null | Out-Null
            }
        }

        Start-Sleep -Seconds 2
    }

    return $null
}

function Restart-AdbServer {
    Write-Host "Redemarrage du serveur ADB"
    if ($DryRun) {
        Write-Host "[dry-run] adb kill-server; adb start-server"
        return
    }

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $adbPath kill-server *> $null
        Start-Sleep -Seconds 2
        & $adbPath start-server *> $null
        Start-Sleep -Seconds 2
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Stop-RunningAndroidEmulators {
    Write-Host "Arret de l'emulateur Android bloque/offline"
    if ($DryRun) {
        Write-Host "[dry-run] Stop-Process emulator/qemu"
        return
    }

    Get-Process -ErrorAction SilentlyContinue |
        Where-Object { $_.ProcessName -in @('emulator', 'qemu-system-x86_64') } |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

function Start-AndroidEmulatorIfPossible {
    $existing = Get-AndroidTargets | Where-Object { $_.Kind -eq 'emulator' } | Select-Object -First 1
    if ($existing) {
        Write-Host "Emulateur deja connecte: $($existing.Serial)"
        return $existing
    }

    $starting = Get-AndroidTargets -IncludeNonReady | Where-Object { $_.Kind -eq 'emulator' } | Select-Object -First 1
    if ($starting) {
        Write-Host "Emulateur detecte mais pas encore pret: $($starting.Serial) ($($starting.State))"
        $readyTarget = Wait-ForAndroidTarget -PreferredKind 'emulator' -TimeoutSeconds 45
        if ($readyTarget) {
            return $readyTarget
        }

        Restart-AdbServer
        $readyTarget = Wait-ForAndroidTarget -PreferredKind 'emulator' -TimeoutSeconds 30
        if ($readyTarget) {
            return $readyTarget
        }

        Stop-RunningAndroidEmulators
    }

    $avds = Get-AvailableAvd
    if (-not $avds.Count) {
        Write-Host "Aucun emulateur Android configure detecte."
        return $null
    }

    $selectedAvd = $avds[0]
    Write-Step "Demarrage de l'emulateur Android $selectedAvd"

    $emulatorArgs = @('-avd', $selectedAvd, '-no-snapshot-load')

    if ($DryRun) {
        Write-Host "[dry-run] $emulatorPath $($emulatorArgs -join ' ')"
        return [pscustomobject]@{
            Serial = 'emulator-dry-run'
            Kind = 'emulator'
            Raw = $selectedAvd
        }
    }

    Start-Process $emulatorPath -ArgumentList $emulatorArgs | Out-Null
    return Wait-ForAndroidTarget -PreferredKind 'emulator' -TimeoutSeconds 120
}

function Invoke-CapRun {
    param(
        [string]$HostName,
        [string]$TargetSerial,
        [switch]$ForwardPorts,
        [switch]$Detached
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

    if ($Detached) {
        $mobileDir = Join-Path $repoRoot 'mobile'
        $title = "SharpEleven Android $TargetSerial"
        $safeSerial = $TargetSerial -replace '[^A-Za-z0-9_.-]', '_'
        $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $logPath = Join-Path $logDir "cap-$safeSerial-$timestamp.log"
        $argList = "@('$($args -join "','")')"
        $command = @(
            "New-Item -ItemType Directory -Path '$logDir' -Force | Out-Null",
            "Set-Location '$mobileDir'",
            "Write-Host 'Log Capacitor: $logPath'",
            "& '$capCliPath' $argList 2>&1 | Tee-Object -FilePath '$logPath'",
            "if (`$LASTEXITCODE -ne 0) { Write-Host ''; Write-Host 'Capacitor a echoue. Voir le log ci-dessus.' -ForegroundColor Red; exit `$LASTEXITCODE }"
        ) -join '; '
        Start-BackgroundPowerShell -Title $title -Command $command | Out-Null
        Start-AndroidLaunchWatchdog -TargetSerial $TargetSerial -LogPath $logPath
        Write-Host "Session live-reload ouverte dans une nouvelle fenetre: $title"
        Write-Host "Log Capacitor: $logPath"
        return
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

function Get-LaunchOptions {
    param([string]$WifiHost)

    $options = [System.Collections.Generic.List[object]]::new()
    $targets = Get-AndroidTargets

    $options.Add([pscustomobject]@{
        Key = 'web-local'
        Label = 'Navigateur web local'
        Action = 'web-local'
        Target = $null
    })

    if ($WifiHost) {
        $options.Add([pscustomobject]@{
            Key = 'web-network'
            Label = "Navigateur web sur le reseau ($WifiHost`:$devServerPort)"
            Action = 'web-network'
            Target = $null
        })
    }

    foreach ($target in ($targets | Where-Object { $_.Kind -eq 'usb' })) {
        $options.Add([pscustomobject]@{
            Key = "usb:$($target.Serial)"
            Label = "Telephone USB ($($target.Serial))"
            Action = 'android-usb'
            Target = $target
        })
    }

    foreach ($target in ($targets | Where-Object { $_.Kind -eq 'wifi' })) {
        $options.Add([pscustomobject]@{
            Key = "wifi:$($target.Serial)"
            Label = "Appareil Android Wi-Fi ADB ($($target.Serial))"
            Action = 'android-wifi'
            Target = $target
        })
    }

    foreach ($target in ($targets | Where-Object { $_.Kind -eq 'emulator' })) {
        $options.Add([pscustomobject]@{
            Key = "emulator:$($target.Serial)"
            Label = "Emulateur Android ($($target.Serial))"
            Action = 'android-emulator'
            Target = $target
        })
    }

    $avds = Get-AvailableAvd
    if ($avds.Count -gt 0 -and -not ($targets | Where-Object { $_.Kind -eq 'emulator' })) {
        $selectedAvd = $avds[0]
        $options.Add([pscustomobject]@{
            Key = "start-emulator:$selectedAvd"
            Label = "Demarrer l'emulateur Android ($selectedAvd)"
            Action = 'android-start-emulator'
            Target = $selectedAvd
        })
    }

    return $options
}

function Select-LaunchOption {
    param(
        [object[]]$Options,
        [string]$WifiHost
    )

    Write-Step "Choix de la cible"
    Write-Host "URL locale: $devServerUrl"
    if ($WifiHost) {
        Write-Host "URL reseau: http://$WifiHost`:$devServerPort/"
    } else {
        Write-Host "Aucune IP IPv4 reseau detectee."
    }
    Write-Host ""

    for ($index = 0; $index -lt $Options.Count; $index++) {
        Write-Host ("[{0}] {1}" -f ($index + 1), $Options[$index].Label)
    }
    Write-Host "[R] Actualiser la liste"
    Write-Host "[Q] Quitter"

    if ($DryRun) {
        Write-Host "[dry-run] selection automatique: 1"
        return $Options[0]
    }

    while ($true) {
        $choice = Read-Host "Choisis une cible (1-$($Options.Count), R, Q)"
        if ($choice -match '^(?i:q)$') {
            return [pscustomobject]@{
                Key = 'quit'
                Label = 'Quitter'
                Action = 'menu-quit'
                Target = $null
            }
        }
        if ($choice -match '^(?i:r)$') {
            return [pscustomobject]@{
                Key = 'refresh'
                Label = 'Actualiser'
                Action = 'menu-refresh'
                Target = $null
            }
        }

        $selectedIndex = 0
        if ([int]::TryParse($choice, [ref]$selectedIndex) -and $selectedIndex -ge 1 -and $selectedIndex -le $Options.Count) {
            return $Options[$selectedIndex - 1]
        }

        Write-Host "Choix invalide. Entre un nombre entre 1 et $($Options.Count)." -ForegroundColor Yellow
    }
}

function Show-LaunchOptions {
    param([object[]]$Options)

    Write-Step "Cibles disponibles"

    for ($index = 0; $index -lt $Options.Count; $index++) {
        $option = $Options[$index]
        $serialText = ''
        if ($option.Target -and $option.Target.Serial) {
            $serialText = " serial=$($option.Target.Serial)"
        }

        Write-Host ("[{0}] {1} ({2}{3})" -f ($index + 1), $option.Label, $option.Action, $serialText)
    }
}

function Select-ForcedLaunchOption {
    param(
        [object[]]$Options,
        [string]$TargetName,
        [string]$Serial
    )

    if ($TargetName -eq 'menu' -and -not $Serial) {
        return $null
    }

    $actionByTarget = @{
        'menu' = @('android-usb', 'android-wifi', 'android-emulator')
        'web-local' = @('web-local')
        'web-network' = @('web-network')
        'usb' = @('android-usb')
        'wifi' = @('android-wifi')
        'emulator' = @('android-emulator', 'android-start-emulator')
    }

    $matchingActions = $actionByTarget[$TargetName]
    $matches = $Options | Where-Object { $matchingActions -contains $_.Action }

    if ($Serial) {
        $matches = $matches | Where-Object { $_.Target -and $_.Target.Serial -eq $Serial }
    }

    $selected = $matches | Select-Object -First 1

    if ($selected) {
        Write-Step "Cible forcee"
        Write-Host "Cible demandee: $TargetName"
        if ($Serial) {
            Write-Host "Serial demande: $Serial"
        }
        Write-Host "Option retenue: $($selected.Label)"
        return $selected
    }

    $available = ($Options | ForEach-Object { $_.Label }) -join ', '
    if ($Serial) {
        throw "Cible '$TargetName' avec serial '$Serial' indisponible. Options disponibles: $available"
    }

    throw "Cible '$TargetName' indisponible. Options disponibles: $available"
}

function Invoke-LaunchOption {
    param(
        [object]$SelectedOption,
        [string]$WifiHost,
        [switch]$DetachedAndroid
    )

    switch ($SelectedOption.Action) {
        'menu-refresh' {
            return
        }
        'menu-quit' {
            return
        }
        'web-local' {
            Open-LocalBrowser
            return
        }
        'web-network' {
            Write-Step "Ouverture du navigateur sur l'URL reseau"
            $networkUrl = "http://$WifiHost`:$devServerPort/"
            Write-Host "URL reseau: $networkUrl"
            if ($DryRun) {
                Write-Host "[dry-run] Start-Process $networkUrl"
                return
            }
            Start-Process $networkUrl | Out-Null
            return
        }
        'android-usb' {
            Write-Step "Lancement de l'app Android sur telephone cable"
            Write-Host "Appareil USB detecte: $($SelectedOption.Target.Serial)"
            Invoke-CapRun -HostName 'localhost' -TargetSerial $SelectedOption.Target.Serial -ForwardPorts -Detached:$DetachedAndroid
            return
        }
        'android-wifi' {
            if (-not $WifiHost) {
                throw "Impossible de lancer en Wi-Fi ADB sans IP reseau locale."
            }

            Write-Step "Lancement de l'app Android sur appareil Wi-Fi ADB"
            Write-Host "Appareil Wi-Fi detecte: $($SelectedOption.Target.Serial)"
            Save-WifiTarget -Serial $SelectedOption.Target.Serial
            Invoke-CapRun -HostName $WifiHost -TargetSerial $SelectedOption.Target.Serial -Detached:$DetachedAndroid
            return
        }
        'android-emulator' {
            Write-Step "Lancement de l'app Android sur emulateur"
            Write-Host "Cible emulateur: $($SelectedOption.Target.Serial)"
            Invoke-CapRun -HostName 'localhost' -TargetSerial $SelectedOption.Target.Serial -ForwardPorts -Detached:$DetachedAndroid
            return
        }
        'android-start-emulator' {
            $emulatorTarget = Start-AndroidEmulatorIfPossible
            if (-not $emulatorTarget) {
                throw "L'emulateur Android n'a pas pu etre demarre."
            }

            Write-Step "Lancement de l'app Android sur emulateur"
            Write-Host "Cible emulateur: $($emulatorTarget.Serial)"
            Invoke-CapRun -HostName 'localhost' -TargetSerial $emulatorTarget.Serial -ForwardPorts -Detached:$DetachedAndroid
            return
        }
        default {
            throw "Action de lancement inconnue: $($SelectedOption.Action)"
        }
    }
}

try {
    Write-Step "Preparation du live-reload Sharp Eleven"

    if (-not (Test-CommandAvailable -CommandName 'npm')) {
        throw 'npm est introuvable dans cette session.'
    }

    if (-not $ListTargets) {
        Start-DevServer
    }

    while ($true) {
        $wifiIp = Get-PreferredIPv4Address
        if (-not $wifiIp) {
            Write-Host "Aucune IP IPv4 reseau detectee."
        }

        $launchOptions = Get-LaunchOptions -WifiHost $wifiIp
        if (-not $launchOptions.Count) {
            throw "Aucune cible de lancement disponible."
        }

        if ($ListTargets) {
            Show-LaunchOptions -Options $launchOptions
            return
        }

        $selectedOption = Select-ForcedLaunchOption -Options $launchOptions -TargetName $Target -Serial $Serial
        $isInteractiveMenu = -not $selectedOption
        if (-not $selectedOption) {
            $selectedOption = Select-LaunchOption -Options $launchOptions -WifiHost $wifiIp
        }

        if ($selectedOption.Action -eq 'menu-quit') {
            Write-Host ""
            Write-Host "Menu ferme. Les sessions deja lancees restent ouvertes dans leurs fenetres." -ForegroundColor Green
            return
        }

        if ($selectedOption.Action -eq 'menu-refresh') {
            continue
        }

        Invoke-LaunchOption -SelectedOption $selectedOption -WifiHost $wifiIp -DetachedAndroid:$isInteractiveMenu

        if (-not $isInteractiveMenu -or $DryRun) {
            break
        }

        Write-Host ""
        Write-Host "Tu peux choisir une autre cible, actualiser la liste, ou quitter le menu." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Live-reload pret. Laisse cette fenetre ouverte pendant le developpement." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Echec du lancement: $($_.Exception.Message)" -ForegroundColor Red

    $details = $_ | Out-String
    if ($details.Trim()) {
        Write-Host $details.Trim()
    }

    if (-not $DryRun) {
        Write-Host ""
        Read-Host "Appuie sur Entree pour fermer"
    }

    exit 1
}
