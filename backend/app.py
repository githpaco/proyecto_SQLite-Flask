from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import sqlite3
import os

# -------------------------------------------------------------
# 🔧 Cargar variables de entorno desde .env
# -------------------------------------------------------------
load_dotenv()

# Configuración básica
DB_PATH = os.getenv("DATABASE_PATH", "../bbdd/chinook.db")
FRONTEND_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/src"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")

app = Flask(__name__, static_folder=FRONTEND_PATH, static_url_path="/")
CORS(app, origins=CORS_ORIGIN)


# -------------------------------------------------------------
# 🧩 Funciones auxiliares
# -------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_table_columns(table_name):
    """Devuelve una lista de las columnas de la tabla"""
    conn = get_db_connection()
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    columns = [col["name"] for col in cursor.fetchall()]
    conn.close()
    return columns


# -------------------------------------------------------------
# 🌐 Rutas API unificadas (Flask 3.1)
# -------------------------------------------------------------

@app.route("/api/tables", methods=["GET"])
def list_tables():
    """Lista todas las tablas de la base de datos SQLite"""
    conn = get_db_connection()
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row["name"] for row in cursor.fetchall()]
    conn.close()
    return jsonify({"tables": tables}), 200


@app.route("/api/tables/<string:table_name>", methods=["GET"])
def get_table_data(table_name):
    """Devuelve los registros de una tabla"""
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    conn = get_db_connection()
    try:
        cursor = conn.execute(f"SELECT * FROM {table_name} LIMIT ? OFFSET ?;", (limit, offset))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"rows": rows}), 200
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

@app.route("/api/tables/<string:table_name>/rows", methods=["GET"])
def get_table_rows(table_name):
    """Devuelve los registros paginados de una tabla con el total de filas"""
    limit = int(request.args.get("limit", 30))
    offset = int(request.args.get("offset", 0))
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # 1️⃣ Obtener el número total de registros en la tabla
        cursor.execute(f"SELECT COUNT(*) AS total FROM {table_name};")
        total = cursor.fetchone()["total"]

        # 2️⃣ Obtener los registros con LIMIT y OFFSET
        cursor.execute(f"SELECT * FROM {table_name} LIMIT ? OFFSET ?;", (limit, offset))
        rows = [dict(row) for row in cursor.fetchall()]

        conn.close()

        # 3️⃣ Devolver también el total al frontend
        return jsonify({
            "rows": rows,
            "total": total
        }), 200

    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

@app.route("/api/tables/<string:table_name>", methods=["POST"])
def create_row(table_name):
    """Crea un nuevo registro en la tabla"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    values = tuple(data.values())

    conn = get_db_connection()
    try:
        conn.execute(f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders})", values)
        conn.commit()
        conn.close()
        return jsonify({"message": "Row inserted successfully"}), 201
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400


@app.route("/api/tables/<string:table_name>/<int:row_id>", methods=["PUT"])
def update_row(table_name, row_id):
    """Actualiza un registro existente"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    set_clause = ", ".join([f"{col}=?" for col in data.keys()])
    values = tuple(data.values()) + (row_id,)

    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE {table_name} SET {set_clause} WHERE rowid=?", values)
        conn.commit()
        conn.close()
        return jsonify({"message": "Row updated successfully"}), 200
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400


@app.route("/api/tables/<string:table_name>/<int:row_id>", methods=["DELETE"])
def delete_row(table_name, row_id):
    """Elimina un registro por ID"""
    conn = get_db_connection()
    try:
        conn.execute(f"DELETE FROM {table_name} WHERE rowid=?", (row_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Row deleted successfully"}), 200
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 400


@app.route("/api/tables/<string:table_name>/schema", methods=["GET"])
def get_table_schema(table_name):
    """Devuelve información sobre las columnas de la tabla"""
    conn = get_db_connection()
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    columns = [
        {
            "cid": row["cid"],
            "name": row["name"],
            "type": row["type"],
            "notnull": bool(row["notnull"]),
            "default_value": row["dflt_value"],
            "primary_key": bool(row["pk"]),
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify({"columns": columns}), 200


# -------------------------------------------------------------
# 🏠 Servir frontend estático (index.html)
# -------------------------------------------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Sirve los archivos estáticos del frontend"""
    if path != "" and os.path.exists(os.path.join(FRONTEND_PATH, path)):
        return send_from_directory(FRONTEND_PATH, path)
    else:
        return send_from_directory(FRONTEND_PATH, "index.html")


# -------------------------------------------------------------
# 🚀 Punto de entrada principal
# -------------------------------------------------------------
if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_RUN_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_RUN_PORT", 5000)),
        debug=os.getenv("FLASK_ENV") == "development",
    )
