import os
import sqlite3
import difflib
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from app.dux_api import enviar_documento_dux

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'productos.db')

print("\n" + "="*50)
print("🚀 INICIANDO SERVIDOR GUN")
if not os.path.exists(DB_PATH):
    print("❌ ERROR: No existe productos.db")
else:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM productos")
        print(f"✅ BD Conectada. Productos: {cursor.fetchone()[0]}")
        conn.close()
    except Exception as e:
        print(f"❌ ERROR: {e}")
print("="*50 + "\n")

def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def preparar_base_datos():
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE productos ADD COLUMN ventas INTEGER DEFAULT 0")
        conn.commit()
        conn.close()
    except sqlite3.OperationalError:
        pass

preparar_base_datos()

def obtener_vocabulario():
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        # VOLVEMOS A "producto"
        cursor.execute("SELECT producto FROM productos")
        nombres = [fila[0].lower() for fila in cursor.fetchall() if fila[0]]
        conn.close()
        
        palabras = set()
        for nombre in nombres:
            for palabra in nombre.split():
                if len(palabra) > 2:
                    palabras.add(palabra)
        return list(palabras)
    except:
        return []

vocabulario_distribuidora = obtener_vocabulario()

@app.route('/api/productos', methods=['GET'])
def buscar_productos():
    query = request.args.get('q', '').lower().strip()
    print(f"[API] Buscando: '{query}'")
    
    if not query:
        return jsonify({"resultados": [], "sugerencia": None})

    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        
        terminos = query.split()
        # VOLVEMOS A "producto"
        condiciones_producto = " AND ".join(["lower(producto) LIKE ?"] * len(terminos))
        parametros_producto = [f"%{t}%" for t in terminos]
        
        # Mandamos el texto bajo todas las etiquetas posibles para que React no falle
        query_sql = f'''
            SELECT 
                codigo, 
                codigo_barra, 
                producto, 
                producto AS nombre, 
                producto AS descripcion,
                producto AS Producto,
                precio, 
                ventas, 
                iva 
            FROM productos 
            WHERE ({condiciones_producto}) 
               OR codigo LIKE ? 
               OR codigo_barra LIKE ?
            ORDER BY ventas DESC
            LIMIT 30
        '''
        
        parametros_totales = parametros_producto + [f"%{query}%", f"%{query}%"]
        cursor.execute(query_sql, parametros_totales)
        filas = cursor.fetchall()
        conn.close()
        
        resultados = [dict(fila) for fila in filas]
        print(f"[API] Encontrados {len(resultados)} productos.")
        
        sugerencia = None
        if not resultados and vocabulario_distribuidora:
            terminos_sugeridos = []
            hubo_cambio = False
            for term in terminos:
                coincidencias = difflib.get_close_matches(term, vocabulario_distribuidora, n=1, cutoff=0.7)
                if coincidencias and coincidencias[0] != term:
                    terminos_sugeridos.append(coincidencias[0])
                    hubo_cambio = True
                else:
                    terminos_sugeridos.append(term)
            if hubo_cambio:
                sugerencia = " ".join(terminos_sugeridos).upper()
        
        return jsonify({
            "resultados": resultados,
            "sugerencia": sugerencia
        })
        
    except Exception as e:
        print(f"[API] ERROR: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/venta', methods=['POST'])
def registrar_venta():
    datos = request.get_json()
    if not datos:
        return jsonify({"status": "error", "mensaje": "Sin datos"}), 400
        
    carrito = datos.get('items', [])
    
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        for item in carrito:
            cursor.execute("UPDATE productos SET ventas = ventas + ? WHERE codigo = ?", 
                           (item['cantidad'], item['codigo']))
        conn.commit()
        conn.close()
        
        respuesta_dux = enviar_documento_dux(datos)
        return jsonify(respuesta_dux)
    except Exception as e:
        print("Error en registro de venta:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)