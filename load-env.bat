@echo off
REM Simple batch file to load .env variables in PowerShell
REM Usage: call load-env.bat

powershell -NoProfile -Command "Get-Content '.env' | Where-Object {$_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'} | ForEach-Object {$key, $value = $_.Split('=', 2); if ($key -and $value) {[System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process)}}"

echo Environment variables loaded from .env
