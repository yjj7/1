# Convert SVG to PNG using Edge headless screenshot
param(
    [string]$SvgPath,
    [string]$PngPath,
    [int]$Width = 1920,
    [int]$Height = 1080
)

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Google\Chrome\Application\chrome.exe"
}

$svgContent = Get-Content $SvgPath -Raw
$html = @"
<!DOCTYPE html>
<html>
<head>
<style>
  html, body { margin: 0; padding: 0; width: ${Width}px; height: ${Height}px; overflow: hidden; background: #000; }
  svg { width: 100%; height: 100%; }
</style>
</head>
<body>
$svgContent
</body>
</html>
"@

$htmlPath = [System.IO.Path]::GetTempFileName() + ".html"
Set-Content -Path $htmlPath -Value $html -Encoding UTF8

$pngFull = (Resolve-Path $PngPath -ErrorAction SilentlyContinue)
if (-not $pngFull) {
    $pngFull = $PngPath
}
$htmlFull = (Resolve-Path $htmlPath).Path

$cmdArgs = "--headless=new --disable-gpu --no-sandbox --window-size=${Width},${Height} --screenshot=`"$pngFull`" --hide-scrollbars `"file:///$htmlFull`""

Write-Output "Running: $edge $cmdArgs"
$output = & $edge --headless=new --disable-gpu --no-sandbox --window-size=${Width},${Height} --screenshot="$pngFull" --hide-scrollbars "file:///$htmlFull" 2>&1
$exitCode = $LASTEXITCODE

Remove-Item $htmlPath -ErrorAction SilentlyContinue

if ($exitCode -ne 0) {
    Write-Error "Edge exited with code $exitCode. Output: $output"
    exit 1
}
Write-Output "OK: $PngPath"
