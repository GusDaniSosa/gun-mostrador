import os
import requests
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv('DUX_TOKEN')
EMPRESA_ID = os.getenv('DUX_EMPRESA_ID')

BASE_URL = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2"

def provocar_colision_dux():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    print(f"📡 Intentando FORZAR la creación del CUIT 20349738172 en la Empresa {EMPRESA_ID}...")
    
    # El truco: el guardia de DUX exige el ID de empresa en la URL, no en el cuerpo
    url = f"{BASE_URL}/clientes?id_empresa={EMPRESA_ID}"
    
    # Dejamos solo los datos del cliente en el paquete JSON
    payload = {
        "documento": "20349738172",
        "razon_social": "CLIENTE DE PRUEBA API"
    }
    
    try:
        respuesta = requests.post(url, json=payload, headers=headers)
        print(f"Estado HTTP: {respuesta.status_code}\n")
        
        print(f"Respuesta cruda de DUX:\n{respuesta.text}")
            
    except Exception as e:
        print(f"❌ Error de red: {e}")

if __name__ == "__main__":
    provocar_colision_dux()