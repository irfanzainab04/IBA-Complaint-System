# IBA Complaint System

## Run locally

1. Open PowerShell in the project root:
```powershell
cd "C:\Users\irfan\OneDrive\Desktop\ST Project\IBA-Complaint-System"
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in your values:
```powershell
Copy-Item ".env.example" ".env"
# Edit .env with your actual values
```

The `.env` file contains all configuration for:
- Database (DATABASE_URL)
- Supabase (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- Session secret (SESSION_SECRET)
- Port numbers (API_SERVER_PORT, FRONTEND_PORT, MOCKUP_PORT)
- Base path (BASE_PATH)
- Node environment (NODE_ENV)

3. Install dependencies:
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
cd artifacts\flask-backend
pip install flask flask-cors supabase PyJWT bcrypt python-dotenv
cd ..\..
pnpm install
```

4. Start the app in 3 terminals:

**Terminal 1 - Flask backend:**
```powershell
.venv\Scripts\Activate.ps1
cd artifacts\flask-backend
python app.py
```

**Terminal 2 - API server:**
```powershell
# Load .env variables
Get-Content .env | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], [System.EnvironmentVariableTarget]::Process) } }
cd artifacts\api-server
npx tsx ./src/index.ts
```

**Terminal 3 - Frontend:**
```powershell
# Load .env variables
Get-Content .env | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], [System.EnvironmentVariableTarget]::Process) } }
cd artifacts\work-order-system
pnpm dev
```

5. Open:
```text
http://localhost:5173
```
