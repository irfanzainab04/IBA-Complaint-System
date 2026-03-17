import os
import uuid
import datetime
import jwt
import bcrypt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.environ.get("SESSION_SECRET", "woms-secret-key-2024")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_json():
    """Parse JSON body regardless of Content-Type header."""
    return request.get_json(force=True, silent=True) or {}


def create_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.current_user_id = payload["user_id"]
            request.current_user_role = payload["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.current_user_role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def get_user_by_id(user_id):
    try:
        result = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return result.data
    except Exception:
        return None


def add_notification(user_id, message, notif_type, work_order_id=None):
    try:
        supabase.table("notifications").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "message": message,
            "type": notif_type,
            "work_order_id": work_order_id,
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat(),
        }).execute()
    except Exception:
        pass


def db_error_response(e):
    err_str = str(e)
    if "PGRST205" in err_str or "schema cache" in err_str:
        return jsonify({"error": "Database tables not set up yet. Please run the SQL setup script in your Supabase SQL Editor."}), 503
    return jsonify({"error": err_str}), 500


# ─── Health ───────────────────────────────────────────────────────────────────

@app.route("/healthz")
def health():
    return jsonify({"status": "ok"})


# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        full_name = data.get("full_name", "").strip()
        role = data.get("role", "student")
        department = data.get("department", "")

        if not email or not password or not full_name:
            return jsonify({"error": "Missing required fields"}), 400

        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            return jsonify({"error": "Email already registered"}), 400

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()

        user = {
            "id": user_id,
            "email": email,
            "password_hash": hashed,
            "full_name": full_name,
            "role": role,
            "department": department,
            "created_at": now,
        }
        supabase.table("users").insert(user).execute()

        token = create_token(user_id, role)
        user.pop("password_hash")
        return jsonify({"user": user, "token": token}), 201
    except Exception as e:
        return db_error_response(e)


@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        result = supabase.table("users").select("*").eq("email", email).execute()
        if not result.data:
            return jsonify({"error": "Invalid credentials"}), 401

        user = result.data[0]
        if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_token(user["id"], user["role"])
        user.pop("password_hash")
        return jsonify({"user": user, "token": token})
    except Exception as e:
        return db_error_response(e)


@app.route("/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"})


@app.route("/auth/me")
@require_auth
def get_me():
    user = get_user_by_id(request.current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.pop("password_hash", None)
    return jsonify(user)


# ─── Users ────────────────────────────────────────────────────────────────────

@app.route("/users")
@require_auth
def list_users():
    try:
        role_filter = request.args.get("role")
        query = supabase.table("users").select("id, email, full_name, role, department, created_at")
        if role_filter:
            query = query.eq("role", role_filter)
        result = query.execute()
        return jsonify(result.data)
    except Exception as e:
        return db_error_response(e)


# ─── Work Orders ──────────────────────────────────────────────────────────────

@app.route("/work-orders")
@require_auth
def list_work_orders():
    try:
        user_id = request.current_user_id
        user_role = request.current_user_role
        status_filter = request.args.get("status")
        priority_filter = request.args.get("priority")
        category_filter = request.args.get("category")

        query = supabase.table("work_orders").select("*").order("created_at", desc=True)

        if user_role in ["student", "faculty"]:
            query = query.eq("requester_id", user_id)
        elif user_role == "technician":
            query = query.eq("assigned_to_id", user_id)

        if status_filter:
            query = query.eq("status", status_filter)
        if priority_filter:
            query = query.eq("priority", priority_filter)
        if category_filter:
            query = query.eq("category", category_filter)

        result = query.execute()
        return jsonify(result.data)
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders", methods=["POST"])
@require_auth
def create_work_order():
    try:
        data = get_json()
        user_id = request.current_user_id
        user = get_user_by_id(user_id)

        wo_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow().isoformat()

        work_order = {
            "id": wo_id,
            "title": data.get("title"),
            "description": data.get("description"),
            "category": data.get("category"),
            "location": data.get("location"),
            "building": data.get("building", ""),
            "priority": data.get("priority", "medium"),
            "status": "open",
            "requester_id": user_id,
            "requester_name": user["full_name"] if user else "",
            "assigned_to_id": None,
            "assigned_to_name": None,
            "rejection_reason": None,
            "created_at": now,
            "updated_at": now,
        }

        result = supabase.table("work_orders").insert(work_order).execute()

        admins = supabase.table("users").select("id").eq("role", "admin").execute()
        for admin in admins.data:
            add_notification(
                admin["id"],
                f"New work order submitted: {work_order['title']}",
                "new_work_order",
                wo_id,
            )

        return jsonify(result.data[0]), 201
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>")
@require_auth
def get_work_order(wo_id):
    try:
        result = supabase.table("work_orders").select("*").eq("id", wo_id).single().execute()
        if not result.data:
            return jsonify({"error": "Not found"}), 404
        return jsonify(result.data)
    except Exception:
        return jsonify({"error": "Not found"}), 404


@app.route("/work-orders/<wo_id>", methods=["PATCH"])
@require_auth
def update_work_order(wo_id):
    try:
        data = get_json()
        allowed = ["title", "description", "category", "location", "building", "priority"]
        updates = {k: v for k, v in data.items() if k in allowed}
        updates["updated_at"] = datetime.datetime.utcnow().isoformat()

        result = supabase.table("work_orders").update(updates).eq("id", wo_id).execute()
        if not result.data:
            return jsonify({"error": "Not found"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>/approve", methods=["POST"])
@require_auth
@require_role("admin")
def approve_work_order(wo_id):
    try:
        now = datetime.datetime.utcnow().isoformat()
        result = supabase.table("work_orders").update({
            "status": "assigned",
            "updated_at": now,
        }).eq("id", wo_id).execute()

        if not result.data:
            return jsonify({"error": "Not found"}), 404

        wo = result.data[0]
        add_notification(wo["requester_id"], f"Your work order '{wo['title']}' has been approved.", "approved", wo_id)
        return jsonify(wo)
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>/reject", methods=["POST"])
@require_auth
@require_role("admin")
def reject_work_order(wo_id):
    try:
        data = get_json()
        reason = data.get("reason", "")
        now = datetime.datetime.utcnow().isoformat()

        result = supabase.table("work_orders").update({
            "status": "closed",
            "rejection_reason": reason,
            "updated_at": now,
        }).eq("id", wo_id).execute()

        if not result.data:
            return jsonify({"error": "Not found"}), 404

        wo = result.data[0]
        add_notification(wo["requester_id"], f"Your work order '{wo['title']}' was rejected. Reason: {reason}", "rejected", wo_id)
        return jsonify(wo)
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>/assign", methods=["POST"])
@require_auth
@require_role("admin")
def assign_work_order(wo_id):
    try:
        data = get_json()
        tech_id = data.get("technician_id")
        tech = get_user_by_id(tech_id)
        if not tech:
            return jsonify({"error": "Technician not found"}), 404

        now = datetime.datetime.utcnow().isoformat()
        result = supabase.table("work_orders").update({
            "assigned_to_id": tech_id,
            "assigned_to_name": tech["full_name"],
            "status": "assigned",
            "updated_at": now,
        }).eq("id", wo_id).execute()

        if not result.data:
            return jsonify({"error": "Not found"}), 404

        wo = result.data[0]
        add_notification(tech_id, f"You have been assigned a work order: '{wo['title']}'", "assigned", wo_id)
        add_notification(wo["requester_id"], f"Your work order '{wo['title']}' has been assigned to {tech['full_name']}.", "assigned", wo_id)
        return jsonify(wo)
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>/status", methods=["PATCH"])
@require_auth
def update_work_order_status(wo_id):
    try:
        data = get_json()
        new_status = data.get("status")
        valid_statuses = ["open", "assigned", "in_progress", "complete", "closed"]
        if new_status not in valid_statuses:
            return jsonify({"error": "Invalid status"}), 400

        now = datetime.datetime.utcnow().isoformat()
        result = supabase.table("work_orders").update({
            "status": new_status,
            "updated_at": now,
        }).eq("id", wo_id).execute()

        if not result.data:
            return jsonify({"error": "Not found"}), 404

        wo = result.data[0]
        add_notification(wo["requester_id"], f"Your work order '{wo['title']}' status changed to {new_status.replace('_', ' ')}.", "status_update", wo_id)
        return jsonify(wo)
    except Exception as e:
        return db_error_response(e)


# ─── Comments ─────────────────────────────────────────────────────────────────

@app.route("/work-orders/<wo_id>/comments")
@require_auth
def get_comments(wo_id):
    try:
        result = supabase.table("comments").select("*").eq("work_order_id", wo_id).order("created_at").execute()
        return jsonify(result.data)
    except Exception as e:
        return db_error_response(e)


@app.route("/work-orders/<wo_id>/comments", methods=["POST"])
@require_auth
def add_comment(wo_id):
    try:
        data = get_json()
        user_id = request.current_user_id
        user = get_user_by_id(user_id)

        comment = {
            "id": str(uuid.uuid4()),
            "work_order_id": wo_id,
            "author_id": user_id,
            "author_name": user["full_name"] if user else "",
            "content": data.get("content", ""),
            "created_at": datetime.datetime.utcnow().isoformat(),
        }
        result = supabase.table("comments").insert(comment).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return db_error_response(e)


# ─── Notifications ────────────────────────────────────────────────────────────

@app.route("/notifications")
@require_auth
def list_notifications():
    try:
        result = supabase.table("notifications").select("*").eq(
            "user_id", request.current_user_id
        ).order("created_at", desc=True).execute()
        return jsonify(result.data)
    except Exception as e:
        return db_error_response(e)


@app.route("/notifications/<notif_id>/read", methods=["POST"])
@require_auth
def mark_read(notif_id):
    try:
        supabase.table("notifications").update({"is_read": True}).eq("id", notif_id).execute()
        return jsonify({"message": "Marked as read"})
    except Exception as e:
        return db_error_response(e)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.route("/dashboard/stats")
@require_auth
def dashboard_stats():
    try:
        user_id = request.current_user_id
        user_role = request.current_user_role

        query = supabase.table("work_orders").select("status, priority, category")
        if user_role in ["student", "faculty"]:
            query = query.eq("requester_id", user_id)
        elif user_role == "technician":
            query = query.eq("assigned_to_id", user_id)

        result = query.execute()
        orders = result.data

        stats = {
            "total": len(orders),
            "open": sum(1 for o in orders if o["status"] == "open"),
            "assigned": sum(1 for o in orders if o["status"] == "assigned"),
            "in_progress": sum(1 for o in orders if o["status"] == "in_progress"),
            "complete": sum(1 for o in orders if o["status"] == "complete"),
            "closed": sum(1 for o in orders if o["status"] == "closed"),
            "urgent": sum(1 for o in orders if o["priority"] == "urgent"),
            "by_category": {},
        }

        for order in orders:
            cat = order.get("category", "general")
            stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1

        return jsonify(stats)
    except Exception as e:
        return db_error_response(e)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
