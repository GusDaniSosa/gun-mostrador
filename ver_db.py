import sqlite3

def revisar_base():
    try:
        conn = sqlite3.connect('datos/productos.db')
        cursor = conn.cursor()
        
        # 1. Ver cómo se llama la tabla realmente
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tablas = cursor.fetchall()
        print("📌 Tablas encontradas en tu SQLite:", tablas)
        
        if tablas:
            nombre_tabla = tablas[0][0]
            # 2. Ver las columnas de esa tabla
            cursor.execute(f"PRAGMA table_info({nombre_tabla});")
            columnas = cursor.fetchall()
            print(f"\n📌 Columnas exactas de la tabla '{nombre_tabla}':")
            for col in columnas:
                print(f" - {col[1]}")
                
        conn.close()
    except Exception as e:
        print("Error leyendo la base de datos:", e)

if __name__ == '__main__':
    revisar_base()