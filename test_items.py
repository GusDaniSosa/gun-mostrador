import os
import json
import requests
from dotenv import load_dotenv

# Cargamos tu token seguro
load_dotenv()
TOKEN = os.getenv('DUX_TOKEN')
BASE_URL = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

print("🔍 Consultando el catálogo de DUX (MODO LECTURA ESTRICTO)...")

try:
    # Hacemos el GET que pide la documentación (sin id_empresa)
    res = requests.get(f"{BASE_URL}/items", headers=headers)
    
    if res.ok:
        datos_crudos = res.json()
        
        # DUX puede devolver la lista directo o adentro de una etiqueta "datos"
        lista_items = datos_crudos.get('datos', datos_crudos) if isinstance(datos_crudos, dict) else datos_crudos
        
        if lista_items and len(lista_items) > 0:
            print(f"\n✅ ¡Éxito! DUX devolvió {len(lista_items)} productos en total.")
            print("Acá tenés la radiografía exacta del PRIMER producto de la lista:\n")
            
            # Imprimimos 1 solo producto formateado para leerlo fácil
            print(json.dumps(lista_items[0], indent=4, ensure_ascii=False))
        else:
            print("⚠️ DUX respondió OK, pero dice que no hay productos.")
    else:
        print(f"❌ Error al consultar DUX. Código: {res.status_code}")
        print(res.text)
        
except Exception as e:
    print(f"❌ Falló la conexión: {e}")