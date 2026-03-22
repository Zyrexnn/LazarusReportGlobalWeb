# push_securely.ps1
# Usage: powershell -ExecutionPolicy Bypass -File scripts/push_securely.ps1

Write-Host "--- Scanning for sensitive data ---" -ForegroundColor Cyan

# Check for .env or secrets accidentally staged
$sensitivePatterns = "NEWSDATA_API_KEY", "WORLDNEWS_API_KEY", "FINNHUB_API_KEY"
foreach ($pattern in $sensitivePatterns) {
    if (git grep -l "$pattern" | Where-Object { $_ -notmatch '(\.env\.example|\.gitignore|src/pages/api/news\.ts|scripts/push_securely\.ps1)' }) {
        Write-Host "[WARNING] Potential leak found for $pattern. Aborting push." -ForegroundColor Red
        exit 1
    }
}

Write-Host "--- Staging all changes ---" -ForegroundColor Cyan
git add .

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Feature Update: $timestamp"

Write-Host "--- Committing changes: '$commitMessage' ---" -ForegroundColor Cyan
git commit -m "$commitMessage"

Write-Host "--- Pushing to GitHub ---" -ForegroundColor Cyan
git push origin main

Write-Host "`nSuccessfully pushed updates to GitHub!" -ForegroundColor Green
