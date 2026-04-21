# Environment Configuration Setup Guide

## Overview

This project uses a **single consolidated `.env` file** at the project root to manage all environment variables for all services (Flask backend, API server, frontend, etc.).

## Setup Steps

### 1. Copy the Example Environment File

```powershell
Copy-Item ".env.example" ".env"
```

### 2. Edit the `.env` File

Open `.env` and fill in your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/complaint_system

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Session & Security
SESSION_SECRET=your-secret-key

# API Server Configuration
API_SERVER_PORT=4000
NODE_ENV=development

# Frontend Configuration
FRONTEND_PORT=5173
BASE_PATH=/

# Mockup Sandbox Configuration
MOCKUP_PORT=3001
```

## Running the Project

### Option 1: Manual Setup (Per Terminal)

**Terminal 1 - Flask Backend:**
```powershell
# Load environment variables
Get-Content .env | Where-Object {$_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'} | ForEach-Object {
    $key, $value = $_.Split('=', 2)
    [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process)
}

.venv\Scripts\Activate.ps1
cd artifacts\flask-backend
python app.py
```

**Terminal 2 - API Server:**
```powershell
# Load environment variables
Get-Content .env | Where-Object {$_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'} | ForEach-Object {
    $key, $value = $_.Split('=', 2)
    [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process)
}

cd artifacts\api-server
npx tsx ./src/index.ts
```

**Terminal 3 - Frontend:**
```powershell
# Load environment variables
Get-Content .env | Where-Object {$_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'} | ForEach-Object {
    $key, $value = $_.Split('=', 2)
    [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process)
}

cd artifacts\work-order-system
pnpm dev
```

### Option 2: Using PowerShell Profile (Easiest)

Add this function to your PowerShell profile (`$PROFILE`):

```powershell
function Load-Env {
    param(
        [string]$Path = ".env"
    )
    if (Test-Path $Path) {
        Get-Content $Path | Where-Object {$_ -notmatch '^\s*#' -and $_ -notmatch '^\s*$'} | ForEach-Object {
            $key, $value = $_.Split('=', 2)
            if ($key -and $value) {
                [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process)
            }
        }
        Write-Host "Environment loaded from $Path"
    } else {
        Write-Host "Error: $Path not found"
    }
}
```

Then in each terminal, just run:
```powershell
Load-Env
cd <service-directory>
<run-command>
```

## Environment Variables Reference

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| SUPABASE_URL | Supabase project URL | Yes | - |
| SUPABASE_SERVICE_KEY | Supabase service role key | Yes | - |
| SESSION_SECRET | JWT secret for session tokens | No | woms-secret-key-2024 |
| API_SERVER_PORT | Port for Express API server | No | 4000 |
| NODE_ENV | Node environment (development/production) | No | development |
| FRONTEND_PORT | Port for frontend Vite dev server | No | 5173 |
| BASE_PATH | Base path for frontend routing | No | / |
| MOCKUP_PORT | Port for mockup sandbox | No | 3001 |

## How Each Service Loads Environment Variables

### Flask Backend
- Automatically loads from root `.env` via `python-dotenv`
- See: `artifacts/flask-backend/app.py`

### API Server  
- Reads from process environment variables
- Must be set before running `npx tsx ./src/index.ts`

### Frontend / Mockup Sandbox
- Reads from process environment variables via `process.env` in vite.config.ts
- Must be set before running `pnpm dev`

## Removing Scattered Environment Files

This setup consolidates environment variables that were previously scattered across:
- Individual shell scripts
- Manual PowerShell variable assignments
- `.env` files in subdirectories (if any existed)

Now everything is centralized in a single `.env` file at the project root.

## Troubleshooting

### "PORT environment variable is required but was not provided"
Make sure you've loaded the `.env` file before running the service. Run the Load-Env command in your terminal.

### Python services can't connect to Supabase
Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly in `.env` and the Flask backend has loaded them.

### Frontend shows 404 or can't connect to API
Check that BASE_PATH in `.env` matches your routing setup, and that the API server is running.

## Git Configuration

The `.env` file is already in `.gitignore`, so your local secrets won't be committed. Only `.env.example` is versioned.
