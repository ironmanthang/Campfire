#requires -Version 5.1
Add-Type -AssemblyName System.Drawing

# Paths
$repo       = "D:\program\Campfire"
$iconSrc    = Join-Path $repo "desktop\src-tauri\icons\icon.png"
$outDir     = Join-Path $repo "store-assets"
$screensDir = Join-Path $outDir "screenshots"
$boxArtPath = Join-Path $outDir "StoreLogo-1x1-1080.png"
$posterPath = Join-Path $outDir "StoreLogo-2x3-720x1080.png"
$icon300Path = Join-Path $outDir "AppIcon-300.png"

# Create dirs
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
New-Item -ItemType Directory -Path $screensDir -Force | Out-Null

# --- Source icon ---
$src = [System.Drawing.Image]::FromFile((Resolve-Path $iconSrc))
Write-Host "Source icon: $($src.Width)x$($src.Height)"

# --- 1:1 Box art (1080x1080) ---
$box = New-Object System.Drawing.Bitmap 1080, 1080
$g = [System.Drawing.Graphics]::FromImage($box)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Dark background (matches your app theme - deep brown/black)
$bg = [System.Drawing.Color]::FromArgb(255, 24, 16, 12)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($bg)), 0, 0, 1080, 1080)

# Center icon at 70% of canvas
$iconSize = 760
$iconX = [int]((1080 - $iconSize) / 2)
$iconY = [int]((1080 - $iconSize) / 2) - 30  # nudge up to make room for text
$g.DrawImage($src, $iconX, $iconY, $iconSize, $iconSize)

# "Campfire" text below
$fontTitle = New-Object System.Drawing.Font("Segoe UI", 96, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 200, 120))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF 0, 900, 1080, 140
$g.DrawString("Campfire", $fontTitle, $textBrush, $rect, $sf)

# Tagline
$fontTag = New-Object System.Drawing.Font("Segoe UI Light", 32, [System.Drawing.FontStyle]::Regular)
$tagBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 200, 180, 150))
$rect2 = New-Object System.Drawing.RectangleF 0, 1020, 1080, 50
$g.DrawString("Journal by the fire", $fontTag, $tagBrush, $rect2, $sf)

$box.Save($boxArtPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $box.Dispose()
Write-Host "Wrote: $boxArtPath"

# --- 2:3 Poster art (720x1080) ---
$poster = New-Object System.Drawing.Bitmap 720, 1080
$g2 = [System.Drawing.Graphics]::FromImage($poster)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Subtle gradient background (dark to slightly lighter)
$rectBg = New-Object System.Drawing.Rectangle 0, 0, 720, 1080
$lgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rectBg,
    [System.Drawing.Color]::FromArgb(255, 32, 20, 14),
    [System.Drawing.Color]::FromArgb(255, 12, 8, 6),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)
$g2.FillRectangle($lgBrush, $rectBg)

# Centered icon (larger)
$iconSize2 = 600
$iconX2 = [int]((720 - $iconSize2) / 2)
$iconY2 = 130
$g2.DrawImage($src, $iconX2, $iconY2, $iconSize2, $iconSize2)

# Title
$fontTitle2 = New-Object System.Drawing.Font("Segoe UI", 72, [System.Drawing.FontStyle]::Bold)
$textBrush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 200, 120))
$sf2 = New-Object System.Drawing.StringFormat
$sf2.Alignment = [System.Drawing.StringAlignment]::Center
$rect3 = New-Object System.Drawing.RectangleF 0, 800, 720, 110
$g2.DrawString("Campfire", $fontTitle2, $textBrush2, $rect3, $sf2)

# Tagline
$fontTag2 = New-Object System.Drawing.Font("Segoe UI Light", 26, [System.Drawing.FontStyle]::Regular)
$tagBrush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 200, 180, 150))
$rect4 = New-Object System.Drawing.RectangleF 0, 920, 720, 40
$g2.DrawString("Journal by the fire", $fontTag2, $tagBrush2, $rect4, $sf2)

$poster.Save($posterPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose(); $poster.Dispose()
Write-Host "Wrote: $posterPath"

# --- App icon (300x300) ---
$icon300 = New-Object System.Drawing.Bitmap 300, 300
$g3 = [System.Drawing.Graphics]::FromImage($icon300)
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g3.DrawImage($src, 0, 0, 300, 300)
$icon300.Save($icon300Path, [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose(); $icon300.Dispose()
Write-Host "Wrote: $icon300Path"

# --- Resize screenshots to 1366x768 (or keep 1366x768 if already that) ---
# Looks for any PNG in the store-assets/screenshots folder (case-insensitive)
$shots = Get-ChildItem $screensDir -Filter "*.png" -ErrorAction SilentlyContinue
if ($shots.Count -eq 0) {
    Write-Host ""
    Write-Host "NOTE: Drop your 4 screenshots into: $screensDir" -ForegroundColor Yellow
    Write-Host "      Then re-run this script to resize them." -ForegroundColor Yellow
} else {
    foreach ($shot in $shots) {
        $img = [System.Drawing.Image]::FromFile($shot.FullName)
        if ($img.Width -ne 1366 -or $img.Height -ne 768) {
            $resized = New-Object System.Drawing.Bitmap 1366, 768
            $gr = [System.Drawing.Graphics]::FromImage($resized)
            $gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $gr.DrawImage($img, 0, 0, 1366, 768)
            $resized.Save($shot.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
            $gr.Dispose(); $resized.Dispose()
            Write-Host "Resized: $($shot.Name) -> 1366x768"
        } else {
            Write-Host "Already 1366x768: $($shot.Name)"
        }
        $img.Dispose()
    }
}

$src.Dispose()
Write-Host ""
Write-Host "Done. Assets in: $outDir" -ForegroundColor Green
Get-ChildItem $outDir -Recurse -File | Select-Object FullName, Length
