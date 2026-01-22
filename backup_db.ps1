$ErrorActionPreference = "Stop"

# Create backups directory if it doesn't exist
$backupDir = Join-Path $PSScriptRoot "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backups directory under $backupDir"
}

# Timestamp for the filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupDir "backup_$timestamp.sql"

Write-Host "Backing up database to $backupFile..."

# Execute pg_dump inside the container and redirect output to file
# We use -i (interactive) to ensure stdout is piped correctly without TTY garbage
# We dump the 'postgres' database which contains the supabase data
docker exec -i supabase_db_barberpro-saas pg_dump -U postgres -d postgres -c > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Saved to: $backupFile"
} else {
    Write-Host "Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
