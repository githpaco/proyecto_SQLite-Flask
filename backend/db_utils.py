# backend/db_utils.py
import sqlite3
from sqlite3 import Row
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "bbdd" / "chinook.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = Row
    return conn

def get_tables():
    """Devuelve lista de nombres de tablas (no views)"""
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        return [r["name"] for r in cur.fetchall()]

def get_table_columns(table):
    """Devuelve lista de columnas con metadata (name,type,pk,notnull)"""
    with get_connection() as conn:
        cur = conn.execute(f"PRAGMA table_info('{table}')")
        cols = []
        for r in cur.fetchall():
            cols.append({
                "cid": r["cid"],
                "name": r["name"],
                "type": r["type"],
                "notnull": bool(r["notnull"]),
                "dflt_value": r["dflt_value"],
                "pk": bool(r["pk"]),
            })
        return cols

def get_primary_key_column(table):
    """Devuelve el nombre de la columna PK si existe, si no devuelve None"""
    cols = get_table_columns(table)
    for c in cols:
        if c["pk"]:
            return c["name"]
    return None

def select_rows(table, limit=100, offset=0):
    pk = get_primary_key_column(table)
    col_list = [c["name"] for c in get_table_columns(table)]
    cols_sql = ", ".join([f'"{c}"' for c in col_list]) if col_list else "*"
    with get_connection() as conn:
        cur = conn.execute(f"SELECT {cols_sql} FROM \"{table}\" LIMIT ? OFFSET ?", (limit, offset))
        rows = [dict(r) for r in cur.fetchall()]
        return {"columns": col_list, "rows": rows}

def count_rows(table):
    with get_connection() as conn:
        cur = conn.execute(f"SELECT COUNT(*) AS cnt FROM \"{table}\"")
        return cur.fetchone()["cnt"]

def get_row_by_pk(table, pk_value):
    pkcol = get_primary_key_column(table)
    with get_connection() as conn:
        if pkcol:
            q = f"SELECT * FROM \"{table}\" WHERE \"{pkcol}\" = ?"
            cur = conn.execute(q, (pk_value,))
        else:
            # usar rowid
            cur = conn.execute(f"SELECT rowid, * FROM \"{table}\" WHERE rowid = ?", (pk_value,))
        r = cur.fetchone()
        return dict(r) if r else None

def insert_row(table, data: dict):
    keys = list(data.keys())
    placeholders = ", ".join("?" for _ in keys)
    cols = ", ".join(f'"{k}"' for k in keys)
    values = [data[k] for k in keys]
    with get_connection() as conn:
        cur = conn.execute(f'INSERT INTO "{table}" ({cols}) VALUES ({placeholders})', tuple(values))
        conn.commit()
        lastrowid = cur.lastrowid
        return get_row_by_pk(table, lastrowid)

def update_row(table, pk_value, data: dict):
    pkcol = get_primary_key_column(table)
    keys = list(data.keys())
    set_clause = ", ".join(f'"{k}" = ?' for k in keys)
    values = [data[k] for k in keys]
    with get_connection() as conn:
        if pkcol:
            q = f'UPDATE "{table}" SET {set_clause} WHERE "{pkcol}" = ?'
            conn.execute(q, tuple(values) + (pk_value,))
        else:
            # use rowid
            q = f'UPDATE "{table}" SET {set_clause} WHERE rowid = ?'
            conn.execute(q, tuple(values) + (pk_value,))
        conn.commit()
        return get_row_by_pk(table, pk_value)

def delete_row(table, pk_value):
    pkcol = get_primary_key_column(table)
    with get_connection() as conn:
        if pkcol:
            q = f'DELETE FROM "{table}" WHERE "{pkcol}" = ?'
            cur = conn.execute(q, (pk_value,))
        else:
            cur = conn.execute(f'DELETE FROM "{table}" WHERE rowid = ?', (pk_value,))
        conn.commit()
        return cur.rowcount
