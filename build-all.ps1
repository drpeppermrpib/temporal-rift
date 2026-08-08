# ============================================================================
# Temporal Rift — channel-aware release builder
# ----------------------------------------------------------------------------
# Produces BOTH distribution artifacts so the wrong update channel can never
# ship by accident:
#   1. Play channel  (window.TR_CHANNEL='play')   -> signed release AAB + APK
#      into playstore\TemporalRift-<ver>.aab / TemporalRift-<ver>-release.apk
#      (no GitHub update banner — Play policy forbids out-of-store updates)
#   2. GitHub channel (window.TR_CHANNEL='github') -> debug APK at repo root
#      TemporalRift.apk (shows the GitHub-release update banner)
#
# The GitHub build runs LAST so www\ and the synced android assets are left in
# the default 'github' state. Each artifact's channel is verified by reading
# index.html inside the zip. Usage:  powershell -File build-all.ps1
# ============================================================================
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$env:JAVA_HOME    = 'C:\Users\drpep\buildtools\jdk21\jdk-21.0.12+8'
$env:ANDROID_HOME = 'C:\Users\drpep\android-sdk'
$env:Path         = "$env:JAVA_HOME\bin;$env:Path"

# Version comes from game.js APP_VERSION (single source of truth for names)
$ver = ([regex]::Match((Get-Content "$root\game.js" -Raw), "const APP_VERSION = '([^']+)'")).Groups[1].Value
if (-not $ver) { throw 'Could not read APP_VERSION from game.js' }
Write-Host "== Building Temporal Rift v$ver (both channels) =="

function Set-Channel([string]$channel) {
    # Copy fresh web assets into www\ then stamp the requested channel
    Copy-Item "$root\index.html", "$root\game.js" "$root\www\" -Force
    # Static art (Gharok sprites, etc.) — Capacitor serves from www\
    if (Test-Path "$root\assets") {
        New-Item -ItemType Directory -Force "$root\www\assets" | Out-Null
        Get-ChildItem "$root\assets" -Directory | Where-Object { $_.Name -ne '_raw' } | ForEach-Object {
            Copy-Item $_.FullName "$root\www\assets\$($_.Name)" -Recurse -Force
        }
        Get-ChildItem "$root\assets" -File | ForEach-Object {
            Copy-Item $_.FullName "$root\www\assets\" -Force
        }
        # nested _raw under character folders is for regenerating art — omit from APK
        Get-ChildItem "$root\www\assets" -Directory -Recurse | Where-Object { $_.Name -eq '_raw' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    # -Encoding UTF8 is required: PS5 otherwise decodes BOM-less UTF-8 as ANSI (mojibake)
    $html = Get-Content "$root\www\index.html" -Raw -Encoding UTF8
    $stamped = $html -replace "window\.TR_CHANNEL='[a-z]+'", "window.TR_CHANNEL='$channel'"
    if ($stamped -notmatch "window\.TR_CHANNEL='$channel'") { throw "Failed to stamp channel '$channel' into www\index.html" }
    # WriteAllText with explicit UTF8-no-BOM (PS5 Set-Content -Encoding UTF8 adds a BOM)
    [System.IO.File]::WriteAllText("$root\www\index.html", $stamped, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "-- www\ stamped with TR_CHANNEL='$channel'"
}

function Invoke-Gradle([string[]]$tasks) {
    Push-Location "$root\android"
    try {
        & .\gradlew.bat @tasks --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "gradlew $($tasks -join ' ') failed (exit $LASTEXITCODE)" }
    } finally { Pop-Location }
}

function Assert-Channel([string]$artifact, [string]$entryPath, [string]$channel) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($artifact)
    try {
        $entry = $zip.GetEntry($entryPath)
        if (-not $entry) { throw "$artifact missing $entryPath" }
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $text = $reader.ReadToEnd(); $reader.Dispose()
        if ($text -notmatch "window\.TR_CHANNEL='$channel'") { throw "$artifact does NOT contain TR_CHANNEL='$channel'" }
        Write-Host "-- VERIFIED $(Split-Path $artifact -Leaf): TR_CHANNEL='$channel'"
    } finally { $zip.Dispose() }
}

# ---------------------------------------------------------------- Play build
Set-Channel 'play'
Push-Location $root; try { npx cap sync android; if ($LASTEXITCODE -ne 0) { throw 'cap sync failed' } } finally { Pop-Location }
Invoke-Gradle @('bundleRelease', 'assembleRelease')
New-Item -ItemType Directory -Force "$root\playstore" | Out-Null
Copy-Item "$root\android\app\build\outputs\bundle\release\app-release.aab" "$root\playstore\TemporalRift-$ver.aab" -Force
Copy-Item "$root\android\app\build\outputs\apk\release\app-release.apk"    "$root\playstore\TemporalRift-$ver-release.apk" -Force
Assert-Channel "$root\playstore\TemporalRift-$ver.aab"        'base/assets/public/index.html' 'play'
Assert-Channel "$root\playstore\TemporalRift-$ver-release.apk" 'assets/public/index.html'     'play'

# -------------------------------------------------------------- GitHub build
# Runs last so www\ + android assets end up back on the default github channel.
Set-Channel 'github'
Push-Location $root; try { npx cap sync android; if ($LASTEXITCODE -ne 0) { throw 'cap sync failed' } } finally { Pop-Location }
Invoke-Gradle @('assembleDebug')
Copy-Item "$root\android\app\build\outputs\apk\debug\app-debug.apk" "$root\TemporalRift.apk" -Force
Assert-Channel "$root\TemporalRift.apk" 'assets/public/index.html' 'github'

Write-Host "`n== DONE v$ver =="
Write-Host "  Play:   playstore\TemporalRift-$ver.aab + TemporalRift-$ver-release.apk (channel=play, no update banner)"
Write-Host "  GitHub: TemporalRift.apk (channel=github, update banner active)"
