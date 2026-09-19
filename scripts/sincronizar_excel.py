import pandas as pd
import sqlite3
import os
import unicodedata

# Rutas absolutas para evitar problemas al ejecutar desde distintos directorios
DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
CARPETA_DATOS = os.path.join(os.path.dirname(DIR_ACTUAL), 'datos')
RUTA_EXCEL = os.path.join(CARPETA_DATOS, 'base_datos_mostrador.xlsx')
RUTA_DB = os.path.join(CARPETA_DATOS, 'productos.db')

def normalizar_columnas(columnas):
    cols_limpias = []
    for col in columnas:
        # Eliminar tildes
        col_sin_tildes = ''.join(
            c for c in unicodedata.normalize('NFD', str(col)) 
            if unicodedata.category(c) != 'Mn'
        )
        # Convertir a minúsculas y reemplazar espacios/barras por guiones bajos
        col_limpia = col_sin_tildes.strip().lower().replace(' ', '_').replace('/', '_').replace('-', '_')
        cols_limpias.append(col_limpia)
    return cols_limpias

def ejecutar_sincronizacion():
    print("⏳ Iniciando lectura del catálogo Excel...")
    
    if not os.path.exists(RUTA_EXCEL):
        print(f"❌ Error: No se encontró el archivo en {RUTA_EXCEL}")
        print("Asegúrate de colocar el archivo de DUX con el nombre 'catalogo_dux.xlsx' dentro de la carpeta 'datos'.")
        return

    try:
        # Leer el Excel (openpyxl debe estar instalado)
        df = pd.read_excel(RUTA_EXCEL)
        
        # Aplicar limpieza de nombres de columnas
        df.columns = normalizar_columnas(df.columns)
        
        print("💾 Reestructurando base de datos SQLite local...")
        conexion = sqlite3.connect(RUTA_DB)
        
        # if_exists='replace' borra la tabla vieja y crea una nueva con los datos actualizados
        df.to_sql('productos', conexion, if_exists='replace', index=False)
        
        # Control de verificación
        cursor = conexion.cursor()
        cursor.execute("SELECT COUNT(*) FROM productos")
        total_filas = cursor.fetchone()[0]
        conexion.close()
        
        print(f"✅ ¡Sincronización perfecta! {total_filas} artículos listos en productos.db")

    except Exception as e:
        print(f"❌ Fallo crítico en la sincronización: {e}")

if __name__ == "__main__":
    ejecutar_sincronizacion()