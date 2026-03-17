"""
Run this to create Supabase tables via direct SQL execution.
Usage: python artifacts/flask-backend/create_tables.py
"""
import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

sql = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT DEFAULT '',
    created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    building TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    assigned_to_id TEXT,
    assigned_to_name TEXT,
    rejection_reason TEXT,
    created_at TEXT DEFAULT '',
    updated_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    work_order_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    work_order_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_requester ON work_orders(requester_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
"""

url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

response = requests.post(url, json={"sql": sql}, headers=headers)
if response.ok:
    print("Tables created successfully!")
else:
    print(f"Error: {response.status_code} - {response.text}")
    print("\nPlease create tables manually in Supabase SQL Editor.")
    print("SQL to run:")
    print(sql)
