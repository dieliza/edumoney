"""Inspección de una base de prueba desechable; no lee ni exporta claves."""
import hashlib
import json
import sqlite3
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = path.read_bytes()
assert len(data) >= 4096, 'La base no se creó completamente'
assert not data.startswith(b'SQLite format 3\x00'), 'La base tiene una cabecera SQLite sin cifrar'
connection = sqlite3.connect(f'file:{path}?mode=ro', uri=True)
try:
    try:
        connection.execute('SELECT count(*) FROM sqlite_master').fetchone()
    except sqlite3.DatabaseError as error:
        assert 'not a database' in str(error), 'Error inesperado al comprobar el cifrado'
    else:
        raise AssertionError('Un lector sin clave pudo abrir la base')
finally:
    connection.close()
print(json.dumps({'encrypted_header': True, 'plain_sqlite_rejected': True,
                  'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))
