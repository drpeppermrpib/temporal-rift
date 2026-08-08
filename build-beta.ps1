# ============================================================================
# Temporal Rift — BETA side-app builder
# ----------------------------------------------------------------------------
# Builds an APK that installs ALONGSIDE the real game (different Android
# identity) so testers can run stable + beta on one device:
#   applicationId  com.drpep.temporalrift.beta
#   app label      "Temporal Rift BETA"
#   channel        github (debug-signed, fine for sideloading)
#   output         rollouts\TemporalRift-BETA-<ver>.apk
#
# It temporarily patches build.gradle / strings.xml / capacitor.config.json,
# builds, then RESTORES the originals and re-syncs android so the tree is
# left exactly as build-all.ps1 leaves it (github channel, stock identity).
# Usage:  powershell -File build-beta.ps1
# ============================================================================
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$env:JAVA_HOME    = 'C:\Users\drpep\buildtools\jdk21\jdk-21.0.12+8'
$env:ANDROID_HOME = 'C:\Users\drpep\android-sdk'
$env:Path         = "$env:JAVA_HOME\bin;$env:Path"

$ver = ([regex]::Match((Get-Content "$root\game.js" -Raw), "const APP_VERSION = '([^']+)'")).Groups[1].Value
if (-not $ver) { throw 'Could not read APP_VERSION from game.js' }
$betaId = 'com.drpep.temporalrift.beta'
Write-Host "== Building Temporal Rift BETA v$ver ($betaId) =="

$gradle  = "$root\android\app\build.gradle"
$strings = "$root\android\app\src\main\res\values\strings.xml"
$capcfg  = "$root\capacitor.config.json"
$patched = @($gradle, $strings, $capcfg)

# ---- backups first: the finally block below always restores these ----------
# (stored OUTSIDE the android res tree — gradle's resource merger rejects
#  stray non-.xml files inside res\values)
$bakDir = "$root\.beta-backup"
New-Item -ItemType Directory -Force $bakDir | Out-Null
for ($i = 0; $i -lt $patched.Count; $i++) { Copy-Item $patched[$i] "$bakDir\$i.bak" -Force }

try {
    # ---- patch identity -----------------------------------------------------
    (Get-Content $gradle -Raw) -replace 'applicationId "com\.drpep\.temporalrift"', "applicationId `"$betaId`"" |
        Set-Content $gradle -Encoding ASCII
    if ((Get-Content $gradle -Raw) -notmatch [regex]::Escape($betaId)) { throw 'failed to patch applicationId' }

    $sx = Get-Content $strings -Raw -Encoding UTF8
    $sx = $sx -replace '<string name="app_name">[^<]+</string>', '<string name="app_name">Temporal Rift BETA</string>'
    $sx = $sx -replace '<string name="title_activity_main">[^<]+</string>', '<string name="title_activity_main">Temporal Rift BETA</string>'
    $sx = $sx -replace '<string name="package_name">[^<]+</string>', "<string name=`"package_name`">$betaId</string>"
    $sx = $sx -replace '<string name="custom_url_scheme">[^<]+</string>', "<string name=`"custom_url_scheme`">$betaId</string>"
    [System.IO.File]::WriteAllText($strings, $sx, (New-Object System.Text.UTF8Encoding($false)))

    $cc = Get-Content $capcfg -Raw -Encoding UTF8
    $cc = $cc -replace '"appId": "com\.drpep\.temporalrift"', "`"appId`": `"$betaId`""
    $cc = $cc -replace '"appName": "Temporal Rift"', '"appName": "Temporal Rift BETA"'
    [System.IO.File]::WriteAllText($capcfg, $cc, (New-Object System.Text.UTF8Encoding($false)))

    # ---- fresh github-channel web assets ------------------------------------
    Copy-Item "$root\index.html", "$root\game.js" "$root\www\" -Force
    if (Test-Path "$root\assets") {
        New-Item -ItemType Directory -Force "$root\www\assets" | Out-Null
        Get-ChildItem "$root\assets" -Directory | Where-Object { $_.Name -ne '_raw' } | ForEach-Object {
            Copy-Item $_.FullName "$root\www\assets\$($_.Name)" -Recurse -Force
        }
        Get-ChildItem "$root\assets" -File | ForEach-Object {
            Copy-Item $_.FullName "$root\www\assets\" -Force
        }
        Get-ChildItem "$root\www\assets" -Directory -Recurse | Where-Object { $_.Name -eq '_raw' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    $html = Get-Content "$root\www\index.html" -Raw -Encoding UTF8
    $stamped = $html -replace "window\.TR_CHANNEL='[a-z]+'", "window.TR_CHANNEL='github'"
    [System.IO.File]::WriteAllText("$root\www\index.html", $stamped, (New-Object System.Text.UTF8Encoding($false)))

    Push-Location $root
    try { npx cap sync android; if ($LASTEXITCODE -ne 0) { throw 'cap sync failed' } } finally { Pop-Location }

    Push-Location "$root\android"
    try {
        & .\gradlew.bat assembleDebug --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "gradlew assembleDebug failed (exit $LASTEXITCODE)" }
    } finally { Pop-Location }

    New-Item -ItemType Directory -Force "$root\rollouts" | Out-Null
    $out = "$root\rollouts\TemporalRift-BETA-$ver.apk"
    Copy-Item "$root\android\app\build\outputs\apk\debug\app-debug.apk" $out -Force

    # ---- verify channel + package identity inside the APK -------------------
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($out)
    try {
        $entry = $zip.GetEntry('assets/public/index.html')
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $text = $reader.ReadToEnd(); $reader.Dispose()
        if ($text -notmatch "window\.TR_CHANNEL='github'") { throw 'BETA apk is not on the github channel' }
        Write-Host "-- VERIFIED $(Split-Path $out -Leaf): TR_CHANNEL='github'"
    } finally { $zip.Dispose() }

    $aapt = Get-ChildItem "$env:ANDROID_HOME\build-tools\*\aapt.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($aapt) {
        $badge = & $aapt.FullName dump badging $out 2>$null | Select-String -Pattern '^package:|application-label:'
        Write-Host "-- aapt: $($badge -join ' | ')"
        if (-not ($badge -match [regex]::Escape($betaId))) { throw "BETA apk package is NOT $betaId" }
        Write-Host "-- VERIFIED package name = $betaId"
    } else {
        Write-Host '-- aapt.exe not found; skipped package-name dump (channel verified above)'
    }

    Write-Host "`n== BETA DONE: $out =="
} finally {
    # ---- always restore the stock identity + resync android -----------------
    for ($i = 0; $i -lt $patched.Count; $i++) {
        if (Test-Path "$bakDir\$i.bak") { Move-Item "$bakDir\$i.bak" $patched[$i] -Force }
    }
    Remove-Item $bakDir -Recurse -Force -ErrorAction SilentlyContinue
    Push-Location $root
    try { npx cap sync android | Out-Null } finally { Pop-Location }
    Write-Host '-- stock identity restored, android re-synced'
}
