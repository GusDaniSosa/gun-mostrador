import os
import sqlite3
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv('DUX_TOKEN')
BASE_URL = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'productos.db')

ID_LISTA_PRECIO = 30567  

def sincronizar_catalogo():
    print("\n" + "="*50)
    print("🚀 INICIANDO SINCRONIZACIÓN CON DETECCIÓN DE CAMBIOS (24HS)")
    print("="*50)
    
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ Error al conectar con la base de datos local: {e}")
        return

    offset = 0
    limit = 50  
    procesados = 0
    nuevos = 0
    actualizados = 0
    sin_cambios = 0

    while True:
        print(f"📥 Escaneando bloque de {limit} productos (desde el {offset})...")
        url = f"{BASE_URL}/items?limit={limit}&offset={offset}"
        
        exito_descarga = False
        intentos = 0
        
        while intentos < 3 and not exito_descarga:
            try:
                res = requests.get(url, headers=headers)
                if res.ok:
                    exito_descarga = True
                    datos = res.json()
                else:
                    intentos += 1
                    print(f"   ⚠️ DUX ocupado (Intento {intentos}/3). Esperando 3 seg...")
                    time.sleep(3)
            except Exception as e:
                intentos += 1
                time.sleep(3)
                
        if not exito_descarga:
            print(f"❌ Bloqueo en offset {offset}. Deteniendo.")
            break
            
        items = datos.get('datos', datos) if isinstance(datos, dict) else datos
        
        if not items or len(items) == 0:
            break 
            
        for item in items:
            if not item.get("habilitado", True):
                continue 
                
            codigo = item.get("cod_item")
            nombre = str(item.get("item") or "").strip()
            iva = float(item.get("porc_iva") or 21.0)
            cod_barra = str(item.get("codigos_barra") or "").strip()
            
            precio_final = 0.0
            precios = item.get("precios", [])
            for p in precios:
                if p.get("id") == ID_LISTA_PRECIO:
                    precio_final = float(p.get("precio", 0))
                    break
            
            if not codigo or precio_final == 0.0:
                continue 
            
            # --- LÓGICA DE DETECCIÓN DE CAMBIOS ---
            # Ahora traemos el precio viejo y el nombre viejo para comparar
            cursor.execute("SELECT codigo, precio, producto FROM productos WHERE codigo = ?", (codigo,))
            existe = cursor.fetchone()
            
            # Formato ISO exacto para que el navegador de React lo entienda sin fallas
            fecha_hoy = datetime.now().isoformat()
            
            if existe:
                precio_viejo = float(existe[1] or 0)
                nombre_viejo = str(existe[2] or "").strip()
                
                # Si hubo variación en el precio o cambiaron la descripción
                if abs(precio_viejo - precio_final) > 0.01 or nombre_viejo != nombre:
                    cursor.execute("""
                        UPDATE productos 
                        SET producto = ?, precio = ?, iva = ?, codigo_barra = ?, precio_anterior = ?, fecha_actualizacion = ?
                        WHERE codigo = ?
                    """, (nombre, precio_final, iva, cod_barra, precio_viejo, fecha_hoy, codigo))
                    actualizados += 1
                else:
                    # Si no cambió ni una letra ni un centavo, lo ignoramos para no prender alertas falsas
                    sin_cambios += 1
            else:
                cursor.execute("""
                    INSERT INTO productos (codigo, codigo_barra, producto, precio, iva, ventas, precio_anterior, fecha_actualizacion)
                    VALUES (?, ?, ?, ?, ?, 0, 0, ?)
                """, (codigo, cod_barra, nombre, precio_final, iva, fecha_hoy))
                nuevos += 1
            
            procesados += 1
            
        conn.commit()
        offset += limit 
        time.sleep(1.5) 
        
    conn.close()
    print("\n" + "="*50)
    print("✅ ESCANEO FINALIZADO")
    print(f"📦 Total procesados: {procesados}")
    print(f"🆕 Artículos nuevos: {nuevos}")
    print(f"🔄 Artículos modificados (Cambio de Precio/Nombre): {actualizados}")
    print(f"⏭️️ Artículos ignorados (Sin cambios): {sin_cambios}")
    print("="*50 + "\n")

if __name__ == '__main__':
    sincronizar_catalogo()