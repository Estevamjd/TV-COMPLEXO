Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\gambi\OneDrive\Área de Trabalho\tv-complexo\public\logo-header.png'
$bmp = New-Object System.Drawing.Bitmap($imgPath)

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

if ($minX -le $maxX -and $minY -le $maxY) {
    $rect = New-Object System.Drawing.Rectangle($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
    $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
    $bmp.Dispose()
    $cropped.Save('C:\Users\gambi\OneDrive\Área de Trabalho\tv-complexo\public\logo-header-cropped.png', [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host 'Cropped successfully.'
} else {
    $bmp.Dispose()
    Write-Host 'Image is empty or transparent.'
}
