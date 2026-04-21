import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load .env from project root
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

sql_statements = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin', 'technician')),
        department TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS work_orders (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('electrical', 'plumbing', 'it', 'lab_equipment', 'safety', 'general')),
        location TEXT NOT NULL,
        building TEXT DEFAULT '',
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'complete', 'closed')),
        requester_id UUID NOT NULL REFERENCES users(id),
        requester_name TEXT NOT NULL,
        assigned_to_id UUID REFERENCES users(id),
        assigned_to_name TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY,
        work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id),
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_work_orders_requester ON work_orders(requester_id);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to_id);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    """,
]

print("Setting up Supabase database tables...")
for i, sql in enumerate(sql_statements):
    try:
        supabase.rpc("exec_sql", {"query": sql}).execute()
        print(f"Statement {i+1} OK")
    except Exception as e:
        print(f"Statement {i+1} via RPC failed: {e}")
        print("Tables may need to be created manually in Supabase SQL editor.")

print("\nDatabase setup attempted. If tables already exist, this is fine.")
print("You can also run the SQL directly in your Supabase project's SQL editor.")
