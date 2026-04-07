param([string]$Token = "18ph9h9f0ot5pgr1g8cwmdzj01d9lrm6qfa81y1yyyp9lldj2xh", [string]$Site = "https://aminel.goatcounter.com")

$headers = @{ Authorization = "Bearer $Token" }
$start = "2026-04-01"
$end = "2026-04-07"

function Fetch($path) {
    Start-Sleep -Milliseconds 300
    try {
        $r = Invoke-WebRequest -Uri "$Site/api/v0/$path" -Headers $headers -UseBasicParsing
        return $r.Content | ConvertFrom-Json
    } catch {
        Write-Host "ERROR $path : $($_.Exception.Message)"
        return $null
    }
}

Write-Host "`n=== PAGES VUES ==="
$hits = Fetch "stats/hits?start=$start&end=$end&limit=10"
if ($hits -and $hits.hits) {
    $hits.hits | Select-Object path, count | Format-Table -AutoSize
} else { Write-Host $hits }

Write-Host "`n=== REFERRERS ==="
$refs = Fetch "stats/toprefs?start=$start&end=$end&limit=20"
if ($refs -and $refs.stats) {
    $refs.stats | Select-Object name, count | Format-Table -AutoSize
} else { Write-Host $refs }

Write-Host "`n=== PAYS ==="
$locations = Fetch "stats/locations?start=$start&end=$end&limit=20"
if ($locations -and $locations.stats) {
    $locations.stats | Select-Object name, count | Sort-Object count -Descending | Format-Table -AutoSize
} else { Write-Host $locations }

Write-Host "`n=== NAVIGATEURS ==="
$browsers = Fetch "stats/browsers?start=$start&end=$end&limit=10"
if ($browsers -and $browsers.stats) {
    $browsers.stats | Select-Object name, count | Format-Table -AutoSize
} else { Write-Host $browsers }

Write-Host "`n=== SYSTEMES ==="
$systems = Fetch "stats/systems?start=$start&end=$end&limit=10"
if ($systems -and $systems.stats) {
    $systems.stats | Select-Object name, count | Format-Table -AutoSize
} else { Write-Host $systems }

Write-Host "`n=== LANGUES ==="
$langs = Fetch "stats/languages?start=$start&end=$end&limit=15"
if ($langs -and $langs.stats) {
    $langs.stats | Select-Object name, count | Format-Table -AutoSize
} else { Write-Host $langs }

Write-Host "`n=== TAILLES D'ECRAN ==="
$sizes = Fetch "stats/sizes?start=$start&end=$end&limit=10"
if ($sizes -and $sizes.stats) {
    $sizes.stats | Select-Object name, count | Format-Table -AutoSize
} else { Write-Host $sizes }

Write-Host "`n=== TOUS LES EVENTS (top 30) ==="
$events = Fetch "stats/hits?start=$start&end=$end&limit=30"
if ($events -and $events.hits) {
    $events.hits | Where-Object { $_.path -like "event/*" } | Select-Object path, count | Format-Table -AutoSize -Wrap
} else { Write-Host $events }

Write-Host "`n=== TOP EVENTS SIMPLIFIES ==="
if ($events -and $events.hits) {
    $events.hits | Where-Object { $_.path -like "event/*" } | ForEach-Object {
        $name = ($_.path -split '/')[1]
        [PSCustomObject]@{ event = $name; count = $_.count }
    } | Group-Object event | ForEach-Object {
        [PSCustomObject]@{ event = $_.Name; total = ($_.Group | Measure-Object count -Sum).Sum }
    } | Sort-Object total -Descending | Format-Table -AutoSize
}
