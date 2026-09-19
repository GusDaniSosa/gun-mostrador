import pandas as pd
import sqlite3

def actualizar_base():
    print("Iniciando actualización de catálogo de GUN...")
    
    try:
        print("Leyendo Excels (esto puede tardar unos segundos)...")
        df_iva = pd.read_excel('datos/productos_lista_mostrador_iva.xls', engine='xlrd')
        df_precios = pd.read_excel('datos/lista_precio_mostrador_con_iva.xls', engine='xlrd')
    except Exception as e:
        print(f"❌ Error al leer los archivos. Detalle: {e}")
        return

    df_iva.columns = df_iva.columns.str.strip()
    df_precios.columns = df_precios.columns.str.strip()

    # Normalización del código
    df_precios = df_precios.rename(columns={'Código': 'CODIGO'})
    df_precios['CODIGO'] = df_precios['CODIGO'].astype(str).str.strip()
    df_iva['CODIGO'] = df_iva['CODIGO'].astype(str).str.strip()

    print("Cruzando datos y calculando...")
    
    try:
        df_final = pd.merge(
            df_precios, 
            df_iva[['CODIGO', 'PORCENTAJE IVA', 'COD BARRA', 'PROVEEDOR']], 
            on='CODIGO', 
            how='inner'
        )
    except KeyError as e:
        print(f"❌ Falló el cruce: {e}")
        return

    # ACÁ ESTÁ LA CORRECCIÓN: Volvemos a llamarlo "producto"
    datos_sqlite = pd.DataFrame({
        'codigo': df_final['CODIGO'].astype(str).str.strip(),
        'codigo_barra': df_final['COD BARRA'].fillna('').astype(str).str.strip(),
        'producto': df_final['Producto'].astype(str).str.strip(),
        'precio': pd.to_numeric(df_final['Precio De Venta Con IVA($)'], errors='coerce').fillna(0),
        'iva': pd.to_numeric(df_final['PORCENTAJE IVA'], errors='coerce').fillna(21),
        'utilidad': pd.to_numeric(df_final['Porc. Utilidad'], errors='coerce').fillna(0),
        'marca': df_final['Marca'].fillna('').astype(str).str.strip(),
        'ultima_modificacion': df_final['Ultima Modificacion'].fillna('').astype(str).str.strip(),
        'ventas': 0
    })

    print("Generando productos.db...")
    conexion = sqlite3.connect('productos.db')
    cursor = conexion.cursor()

    cursor.execute('DROP TABLE IF EXISTS productos')
    # ACÁ ESTÁ LA CORRECCIÓN: producto TEXT
    cursor.execute('''
        CREATE TABLE productos (
            codigo TEXT PRIMARY KEY,
            codigo_barra TEXT,
            producto TEXT,
            precio REAL,
            iva REAL,
            utilidad REAL,
            marca TEXT,
            ultima_modificacion TEXT,
            ventas INTEGER DEFAULT 0
        )
    ''')

    datos_sqlite.to_sql('productos', conexion, if_exists='append', index=False)
    
    cursor.execute('CREATE INDEX idx_codigo ON productos(codigo)')
    cursor.execute('CREATE INDEX idx_codigo_barra ON productos(codigo_barra)')
    # ACÁ ESTÁ LA CORRECCIÓN: índice en producto
    cursor.execute('CREATE INDEX idx_producto ON productos(producto)')
    
    conexion.commit()
    conexion.close()
    print("✅ ¡Éxito total! Tu archivo productos.db está actualizado y listo para usar.")

if __name__ == '__main__':
    actualizar_base()