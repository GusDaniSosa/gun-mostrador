import sqlite3
import os

DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
RUTA_DB = os.path.join(os.path.dirname(DIR_ACTUAL), 'datos', 'productos.db')

def buscar_producto(termino):
    conexion = sqlite3.connect(RUTA_DB)
    conexion.row_factory = sqlite3.Row  # Transforma los resultados en diccionarios
    cursor = conexion.cursor()
    
    # Busca coincidencias exactas por código/barra, o parciales por descripción
    query = """
        SELECT * FROM productos 
        WHERE codigo = ? OR codigo_barra = ? OR descripcion LIKE ?
        LIMIT 20
    """
    cursor.execute(query, (termino, termino, f'%{termino}%'))
    resultados = [dict(row) for row in cursor.fetchall()]
    
    conexion.close()
    return resultados