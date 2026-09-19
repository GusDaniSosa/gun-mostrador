import sqlite3

def inicializar_base_datos():
    # Se conecta al archivo (si no existe, lo crea automáticamente)
    conn = sqlite3.connect('productos.db')
    cursor = conn.cursor()

    # Creamos la tabla con las columnas exactas que usa el frontend
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            precio REAL NOT NULL
        )
    ''')

    # Limpiamos la tabla por si ya tenía datos de pruebas anteriores
    cursor.execute('DELETE FROM productos')
    
    # Inyectamos los productos que intentaste buscar desde React
    productos_prueba = [
        ('dr6601', 'ENERGY DRINK MONSTER 473ML', 2500.00),
        ('77912345', 'YERBA MATE TARAGUI 1KG', 3500.00),
        ('77954321', 'AZUCAR LEDESMA 1KG', 900.00)
    ]

    cursor.executemany('''
        INSERT INTO productos (codigo, nombre, precio) 
        VALUES (?, ?, ?)
    ''', productos_prueba)

    # Guardamos los cambios y cerramos la conexión
    conn.commit()
    conn.close()
    
    print("✅ Base de datos 'productos.db' creada y cargada con éxito.")

if __name__ == '__main__':
    inicializar_base_datos()