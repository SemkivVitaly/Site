# Script for generating random secret keys
# Run: powershell -ExecutionPolicy Bypass -File generate-secrets.ps1

Write-Host "Generating random secret keys..." -ForegroundColor Green

# Function to generate random string
function Generate-RandomString {
    param([int]$Length = 32)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $random = New-Object System.Random
    $result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $result += $chars[$random.Next(0, $chars.Length)]
    }
    return $result
}

$jwtSecret = Generate-RandomString -Length 64
$qrSecret = Generate-RandomString -Length 64

Write-Host ""
Write-Host "Generated keys:" -ForegroundColor Yellow
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Cyan
Write-Host "QR_POINT_SECRET=$qrSecret" -ForegroundColor Cyan

Write-Host ""
Write-Host "Copy these values to .env file" -ForegroundColor Green

# Create file with keys
$keysFile = "generated-secrets.txt"
$content = "JWT_SECRET=$jwtSecret`nQR_POINT_SECRET=$qrSecret"
$content | Out-File -FilePath $keysFile -Encoding UTF8

Write-Host ""
Write-Host "Keys also saved to: $keysFile" -ForegroundColor Green

