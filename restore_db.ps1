$ErrorActionPreference = "Stop"

$backupDir = Join-Path $PSScriptRoot "backups"

# Check if backups folder exists
if (-not (Test-Path $backupDir)) {
    Write-Host "No backups directory found at $backupDir" -ForegroundColor Red
    exit
}

# List available backups
$backups = Get-ChildItem -Path $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "No backup files found in $backupDir" -ForegroundColor Yellow
    exit
}

Write-Host "Available Backups:"
for ($i = 0; $i -lt $backups.Count; $i++) {
    Write-Host "[$i] $($backups[$i].Name) ($($backups[$i].LastWriteTime))"
}

$selection = Read-Host "Select backup number to restore (0-$($backups.Count - 1))"

if ($selection -match "^\d+$" -and [int]$selection -ge 0 -and [int]$selection -lt $backups.Count) {
    $fileToRestore = $backups[[int]$selection]
    Write-Host "Restoring from $($fileToRestore.Name)..." -ForegroundColor Cyan
    
    # Confirm before proceeding
    $confirm = Read-Host "WARNING: This will OVERWRITE current database data. Are you sure? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Restore cancelled."
        exit
    }

    # Restore command
    # We use psql to execute the SQL commands from the file
    Get-Content $fileToRestore.FullName | docker exec -i supabase_db_barberpro-saas psql -U postgres -d postgres

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restore completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Restore failed." -ForegroundColor Red
    }

} else {
    Write-Host "Invalid selection." -ForegroundColor Red
}
