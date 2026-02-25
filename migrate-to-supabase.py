#!/usr/bin/env python3
"""
Migrate MySQL data to Supabase PostgreSQL.
Usage: python3 migrate-to-supabase.py

Requires: pip install pymysql supabase
Set env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
"""

import os
import sys
import pymysql
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # service role for inserts

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

mysql_conn = pymysql.connect(
    host='localhost', user='root', password='administrador123!',
    database='preseleccionados', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

BATCH = 500

def migrate_table(table_name, columns):
    """Export from MySQL and insert into Supabase in batches."""
    print(f"\n=== Migrating {table_name} ===")
    cur = mysql_conn.cursor()
    cur.execute(f"SELECT COUNT(*) as c FROM {table_name}")
    total = cur.fetchone()['c']
    print(f"  Total rows: {total:,}")

    cur.execute(f"SELECT {', '.join(columns)} FROM {table_name}")
    rows = cur.fetchall()

    # Convert boolean fields
    for row in rows:
        for k, v in row.items():
            if isinstance(v, bytes):
                row[k] = bool(v[0]) if len(v) == 1 else v.decode()

    uploaded = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        try:
            sb.table(table_name).insert(batch).execute()
            uploaded += len(batch)
            pct = uploaded * 100 // total
            print(f"  [{pct:3d}%] {uploaded:,} / {total:,}", end='\r')
        except Exception as e:
            print(f"\n  ERROR at batch {i}: {e}")
            # Try one by one
            for row in batch:
                try:
                    sb.table(table_name).insert(row).execute()
                    uploaded += 1
                except Exception as e2:
                    print(f"  SKIP row: {e2}")

    print(f"\n  Done: {uploaded:,} rows uploaded")


# --- Migrate each table ---

migrate_table('preseleccionados', [
    'numero', 'modalidad', 'dni', 'apellidos_nombres', 'region',
    'puntaje_enp', 'condiciones_priorizables', 'caracteristicas_labor_docente',
    'puntaje_final', 'resultado'
])

migrate_table('no_preseleccionados', [
    'numero', 'modalidad', 'dni', 'apellidos_nombres', 'region',
    'puntaje_enp', 'condiciones_priorizables', 'puntaje_final', 'resultado'
])

migrate_table('descalificados', [
    'numero', 'modalidad', 'dni', 'apellidos_nombres', 'condicion', 'causal'
])

migrate_table('ies_elegibles', [
    'item', 'ies', 'tipo_ies', 'tipo_gestion', 'departamento',
    'sede_distrito', 'programa_academico', 'modalidad_estudio', 'es_eib', 'grupo'
])

migrate_table('reglas_puntaje', [
    'etapa', 'concepto', 'criterio', 'indicador',
    'puntaje', 'puntaje_maximo', 'aplica_eib', 'notas'
])

migrate_table('puntajes_corte', [
    'modalidad', 'min_preseleccionado', 'max_preseleccionado',
    'avg_preseleccionado', 'max_no_preseleccionado',
    'vacantes_preseleccion', 'becas_disponibles'
])

migrate_table('causales_descalificacion', [
    'causal_codigo', 'causal_descripcion', 'cantidad'
])

mysql_conn.close()
print("\n=== Migration complete ===")
