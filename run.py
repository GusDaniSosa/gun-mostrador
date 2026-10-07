import os
import sqlite3
import difflib
import traceback
import requests
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from app.dux_api import enviar_documento_dux, consultar_numero_comprobante
from sincronizador import sincronizar_catalogo 

load_dotenv()

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
    except sqlite3.OperationalError: pass
    
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE productos ADD COLUMN precio_anterior REAL DEFAULT 0")
        cursor.execute("ALTER TABLE productos ADD COLUMN fecha_actualizacion TEXT")
        conn.commit()
    except sqlite3.OperationalError: pass

    # --- NUEVA TABLA: LA BÓVEDA DEL DICCIONARIO ---
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diccionario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                callejera TEXT UNIQUE,
                oficial TEXT
            )
        ''')
        conn.commit()
    except Exception as e: 
        print(f"Error creando diccionario: {e}")
    finally:
        conn.close()

preparar_base_datos()

def obtener_vocabulario():
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
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

@app.route('/api/clientes', methods=['GET'])
def buscar_clientes():
    query = request.args.get('q', '').strip()
    if not query: return jsonify({"resultados": []})
    try:
        token_dux = os.getenv('DUX_TOKEN', '')
        empresa_id = os.getenv('DUX_EMPRESA_ID', '')
        url_dux = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2/clientes"
        headers = {"Authorization": f"Bearer {token_dux}", "Content-Type": "application/json"}
        
        def consultar_a_dux(texto_busqueda):
            parametros = {"id_empresa": empresa_id, "habilitado": "true"}
            if texto_busqueda.isdigit(): parametros["nro_doc"] = texto_busqueda
            else: parametros["apellido_nombre"] = texto_busqueda
            respuesta = requests.get(url_dux, headers=headers, params=parametros)
            if respuesta.ok: return respuesta.json().get("datos", [])
            return []

        lista_dux = consultar_a_dux(query)
        if not lista_dux and not query.isdigit():
            palabras = query.split()
            if len(palabras) > 1:
                query_invertida = " ".join(reversed(palabras))
                lista_dux = consultar_a_dux(query_invertida)
                
        resultados = []
        for cli in lista_dux:
            if cli.get("habilitado") is False: continue
            resultados.append({
                "id": cli.get("id_cliente"),
                "nombre": str(cli.get("full_name") or cli.get("apellido_razon_social", "Sin Nombre")),
                "cuit": str(cli.get("cuit_cuil", "00000000")),
                "categoria_iva": cli.get("categoria_fiscal", "Consumidor Final")
            })
            if len(resultados) >= 15: break
        return jsonify({"resultados": resultados})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clientes/<int:id_cliente>', methods=['GET'])
def obtener_cliente(id_cliente):
    try:
        url = f"https://erp.duxsoftware.com.ar/WSERP/rest/services/v2/clientes/{id_cliente}"
        headers = {"Authorization": f"Bearer {os.getenv('DUX_TOKEN')}"}
        res = requests.get(url, headers=headers)
        if res.ok: return jsonify(res.json())
        return jsonify({"error": "No se encontró el cliente"}), res.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clientes', methods=['POST'])
def crear_cliente():
    try:
        url = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2/clientes"
        headers = {"Authorization": f"Bearer {os.getenv('DUX_TOKEN')}", "Content-Type": "application/json"}
        datos_cliente = request.json 
        empresa_id = os.getenv('DUX_EMPRESA_ID')
        parametros = {"id_empresa": empresa_id}
        res = requests.post(url, headers=headers, params=parametros, json=datos_cliente)
        if res.ok: return jsonify({"mensaje": "Cliente creado", "datos": res.json()})
        else: return jsonify({"error": "Error al crear", "detalle": res.text}), res.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clientes/<int:id_cliente>', methods=['PUT'])
def actualizar_cliente(id_cliente):
    try:
        url = f"https://erp.duxsoftware.com.ar/WSERP/rest/services/v2/clientes/{id_cliente}"
        headers = {"Authorization": f"Bearer {os.getenv('DUX_TOKEN')}", "Content-Type": "application/json"}
        datos_cliente = request.json
        empresa_id = os.getenv('DUX_EMPRESA_ID')
        parametros = {"id_empresa": empresa_id}
        res = requests.put(url, headers=headers, params=parametros, json=datos_cliente)
        if res.ok: return jsonify({"mensaje": "Cliente actualizado", "datos": res.json()})
        else: return jsonify({"error": "Error al actualizar", "detalle": res.text}), res.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- NUEVA RUTA: GUARDAR PALABRAS EN EL DICCIONARIO ---
@app.route('/api/diccionario', methods=['POST'])
def agregar_diccionario():
    datos = request.json
    callejera = datos.get('callejera', '').strip().lower()
    oficial = datos.get('oficial', '').strip().lower()
    
    if not callejera or not oficial:
        return jsonify({"error": "Faltan datos"}), 400
        
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO diccionario (callejera, oficial) VALUES (?, ?)", (callejera, oficial))
        conn.commit()
        conn.close()
        return jsonify({"status": "ok", "mensaje": "Sinónimo guardado exitosamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/productos', methods=['GET'])
def buscar_productos():
    query_original = request.args.get('q', '').lower().strip()
    if not query_original: return jsonify({"resultados": [], "sugerencia": None, "traduccion": None})
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        
        # --- EL INTERCEPTOR DE BÚSQUEDA ---
        cursor.execute("SELECT callejera, oficial FROM diccionario")
        diccionario_db = cursor.fetchall()
        
        query_traducida = query_original
        texto_traducido_aviso = None
        
        for fila in diccionario_db:
            calle = str(fila['callejera']).lower().strip()
            oficial = str(fila['oficial']).lower().strip()
            # Si el "lenguaje de calle" está dentro de lo que escribió el cajero, lo reemplaza
            if calle and calle in query_traducida:
                query_traducida = query_traducida.replace(calle, oficial)
                texto_traducido_aviso = oficial.upper() # Prepara el aviso para React
        
        terminos = query_traducida.split()
        condiciones_producto = " AND ".join(["lower(producto) LIKE ?"] * len(terminos))
        parametros_producto = [f"%{t}%" for t in terminos]
        
        query_sql = f'''
            SELECT codigo, codigo_barra, producto, producto AS nombre, producto AS descripcion, 
                   producto AS Producto, precio, ventas, iva, precio_anterior, fecha_actualizacion 
            FROM productos 
            WHERE ({condiciones_producto}) OR codigo LIKE ? OR codigo_barra LIKE ?
            ORDER BY ventas DESC LIMIT 30
        '''
        # Usamos el query_original para los códigos de barra por si pistolean
        parametros_totales = parametros_producto + [f"%{query_original}%", f"%{query_original}%"]
        cursor.execute(query_sql, parametros_totales)
        filas = cursor.fetchall()
        conn.close()
        resultados = [dict(fila) for fila in filas]
        
        sugerencia = None
        if not resultados and vocabulario_distribuidora:
            terminos_sugeridos = []
            hubo_cambio = False
            for term in terminos:
                coincidencias = difflib.get_close_matches(term, vocabulario_distribuidora, n=1, cutoff=0.7)
                if coincidencias and coincidencias[0] != term:
                    terminos_sugeridos.append(coincidencias[0])
                    hubo_cambio = True
                else: terminos_sugeridos.append(term)
            if hubo_cambio: sugerencia = " ".join(terminos_sugeridos).upper()
            
        # Devolvemos a React los resultados, y le avisamos si usamos el traductor
        return jsonify({
            "resultados": resultados, 
            "sugerencia": sugerencia,
            "traduccion": texto_traducido_aviso 
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/venta', methods=['POST'])
def registrar_venta():
    datos = request.get_json()
    if not datos: return jsonify({"status": "error", "mensaje": "Sin datos"}), 400
    carrito = datos.get('items', [])
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        for item in carrito:
            cursor.execute("UPDATE productos SET ventas = ventas + ? WHERE codigo = ?", (item['cantidad'], item['codigo']))
        conn.commit()
        conn.close()
        respuesta_dux = enviar_documento_dux(datos)
        return jsonify(respuesta_dux)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rastrear_numero', methods=['GET'])
def rastrear_numero():
    id_dux = request.args.get('id')
    tipo = request.args.get('tipo', 'factura')
    total = request.args.get('total')
    
    if not id_dux: return jsonify({"numero": None})
    resultado = consultar_numero_comprobante(id_dux, tipo, total)
    if isinstance(resultado, dict): return jsonify(resultado)
    return jsonify({"numero": resultado})

@app.route('/api/sincronizar', methods=['POST'])
def iniciar_sincronizacion():
    try:
        hilo = threading.Thread(target=sincronizar_catalogo)
        hilo.start()
        return jsonify({"status": "ok", "mensaje": "Sincronización lanzada en segundo plano"})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)