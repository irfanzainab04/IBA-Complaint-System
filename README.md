# IBA Complaint System

## Run locally

1. Open PowerShell in the project root:
```powershell
cd "C:\Users\irfan\OneDrive\Desktop\ST Project\IBA-Complaint-System"
```

2. Install dependencies:
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
cd artifacts\flask-backend
pip install flask flask-cors supabase PyJWT bcrypt python-dotenv
cd ..\..
pnpm install
```

3. Add your `.env` values in the backend folders as needed.

4. Start the app in 3 terminals:

Flask backend:
```powershell
.venv\Scripts\Activate.ps1
cd artifacts\flask-backend
python app.py
```

API server:
```powershell
$env:PORT="4000"
$env:NODE_ENV="development"
cd artifacts\api-server
npx tsx ./src/index.ts
```

Frontend:
```powershell
$env:PORT="5173"
$env:BASE_PATH="/"
cd artifacts\work-order-system
npx vite dev
```

5. Open:
```text
http://localhost:5173
```
