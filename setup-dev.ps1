# Setup script to load environment variables from .env file and start development servers
# Usage: ./setup-dev.ps1

# Load .env file
$envFile = Join-Path (Get-Location) ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$') {
            $key, $value = $_.Split('=', 2)
            if ($key -and $value) {
                $key = $key.Trim()
                $value = $value.Trim()
                [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
                Write-Host "Set $key=$value"
            }
        }
    }
    Write-Host "Environment variables loaded from .env`n"
} else {
    Write-Host "Error: .env file not found at $envFile"
    Write-Host "Please copy .env.example to .env and fill in your values"
    exit 1
}

# Use environment variables with fallbacks
$apiPort = [System.Environment]::GetEnvironmentVariable("API_SERVER_PORT", [System.EnvironmentVariableTarget]::Process) ?? "4000"
$frontendPort = [System.Environment]::GetEnvironmentVariable("FRONTEND_PORT", [System.EnvironmentVariableTarget]::Process) ?? "5173"
$basePath = [System.Environment]::GetEnvironmentVariable("BASE_PATH", [System.EnvironmentVariableTarget]::Process) ?? "/"
$nodeEnv = [System.Environment]::GetEnvironmentVariable("NODE_ENV", [System.EnvironmentVariableTarget]::Process) ?? "development"

Write-Host "Starting development servers..."
Write-Host "API Server will run on port: $apiPort"
Write-Host "Frontend will run on port: $frontendPort"
Write-Host "Base path: $basePath"
Write-Host "Node environment: $nodeEnv"
Write-Host ""
Write-Host "You can now run the following commands in separate terminals:`n"
Write-Host "1. Flask Backend:"
Write-Host "   .venv\Scripts\Activate.ps1"
Write-Host "   cd artifacts\flask-backend"
Write-Host "   python app.py`n"
Write-Host "2. API Server:"
Write-Host "   cd artifacts\api-server"
Write-Host "   npx tsx ./src/index.ts`n"
Write-Host "3. Frontend (Work Order System):"
Write-Host "   cd artifacts\work-order-system"
Write-Host "   pnpm dev`n"
