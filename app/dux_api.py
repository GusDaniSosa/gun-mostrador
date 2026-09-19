import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Lee tus credenciales exactas del archivo .env
load_dotenv()
TOKEN = os.getenv('DUX_TOKEN')
EMPRESA_ID = os.getenv('DUX_EMPRESA_ID')

BASE_URL = "https://erp.duxsoftware.com.ar/WSERP/rest/services/v2"

def obtener_headers():
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

def gestionar_cliente(dni_cuit, nombre_cliente):
    url_busqueda = f"{BASE_URL}/clientes?id_empresa={EMPRESA_ID}&documento={dni_cuit}"
    try:
        respuesta = requests.get(url_busqueda, headers=obtener_headers())
        if respuesta.status_code == 200:
            datos_get = respuesta.json()
            if isinstance(datos_get, list) and len(datos_get) > 0:
                cliente = datos_get[0]
                if "datos" in cliente:
                    cliente = cliente["datos"]
                id_dux = cliente.get('id_cliente') or cliente.get('id')
                if id_dux:
                    return {"id_dux": id_dux, "estado": "existente"}
        
        url_crear = f"{BASE_URL}/clientes?id_empresa={EMPRESA_ID}"
        payload = {"documento": dni_cuit, "apellido_razon_social": nombre_cliente}
        creacion = requests.post(url_crear, json=payload, headers=obtener_headers())
        
        if creacion.status_code in [200, 201]:
            nuevo_cliente = creacion.json()
            if isinstance(nuevo_cliente, dict) and "datos" in nuevo_cliente:
                datos_internos = nuevo_cliente["datos"]
            else:
                datos_internos = nuevo_cliente[0] if isinstance(nuevo_cliente, list) else nuevo_cliente
                
            id_dux = datos_internos.get('id_cliente')
            if id_dux:
                return {"id_dux": id_dux, "estado": "creado"}
            else:
                return {"error": "Estructura sin ID"}
        else:
            return {"error": "Fallo al crear cliente"}
    except Exception as e:
        return {"error": str(e)}

def enviar_documento_dux(datos_venta):
    tipo = datos_venta.get('tipo')
    items = datos_venta.get('items', [])
    descuento_global = datos_venta.get('descuento_total', 0)
    id_personal = datos_venta.get('id_personal')
    
    condicion_pago = datos_venta.get('condicion_pago') 
    metodo_pago = datos_venta.get('metodo_pago') 
    
    # Redondeo exacto
    total_final = round(float(datos_venta.get('total_final', 0)), 2)
    # Fecha actual en formato ISO (YYYY-MM-DD) requerida por el esquema V2FacturaCobro
    fecha_actual = datetime.now().strftime('%Y-%m-%d')

    endpoints = {
        'presupuesto': f"{BASE_URL}/presupuestos",
        'comprobante_venta': f"{BASE_URL}/facturas", 
        'factura': f"{BASE_URL}/facturas"
    }
    
    url_destino = endpoints.get(tipo)
    if not url_destino:
        return {"error": "Tipo de comprobante desconocido"}

    renglones_dux = []
    for item in items:
        precio_cobrado = float(item['precio_cobrado'])
        porc_iva = float(item.get('iva', 21))
        
        if tipo == 'presupuesto':
            divisor = 1 + (porc_iva / 100)
            precio_neto = precio_cobrado / divisor
        else:
            precio_neto = precio_cobrado
            
        renglones_dux.append({
            "cod_item": str(item['codigo']),
            "ctd": float(item['cantidad']),
            "precio_uni": round(precio_neto, 8),
            "porc_iva": porc_iva,  
            "porc_desc": 0.0 
        })

    payload = {
        "id_empresa": int(EMPRESA_ID),         
        "id_sucursal": 1,                      
        "id_cliente": 14020175,                
        "descuento_global": float(descuento_global)
    }

    if id_personal:
        payload["id_personal"] = int(id_personal)

    if tipo == 'presupuesto':
        payload["items"] = renglones_dux
    else:
        payload["productos"] = renglones_dux
        payload["id_deposito"] = 10646
        payload["nro_pto_vta"] = 6
        
        if id_personal:
            payload["id_vendedor"] = int(id_personal)
            
        if condicion_pago == 'CUENTA_CORRIENTE':
            payload["id_condicion_pago"] = 9825
        elif condicion_pago == 'CONTADO':
            payload["id_condicion_pago"] = 9826
        
        if tipo == 'factura':
            payload["tipo_comp"] = "FACTURA"
            payload["letra_comp"] = "B"
        elif tipo == 'comprobante_venta':
            payload["tipo_comp"] = "COMPROBANTE_VENTA"
            payload["letra_comp"] = "X"

    # --- MAGIA BASADA EN OPENAPI ---
    if tipo in ['comprobante_venta', 'factura'] and condicion_pago == 'CONTADO' and metodo_pago:
        
        # 1. El detalle del cobro (El array)
        detalle_cobro = {
            "tipo_valor": metodo_pago, # EFECTIVO o TARJETA
            "monto": total_final
        }
        
        if metodo_pago == "TARJETA":
            detalle_cobro["id_tarjeta"] = 15233
            detalle_cobro["id_plan_tarjeta"] = 1
            detalle_cobro["id_terminal"] = 6050
            detalle_cobro["nro_cupon"] = "000000"
            detalle_cobro["nro_lote"] = "000"
            
        # 2. El objeto "cobro" (No es un array, es un dict)
        payload["cobro"] = {
            "fecha_cobro": fecha_actual,
            "total": total_final,
            "id_caja": 19990,
            "id_moneda": 1,
            "cotiza_moneda": 1.0,
            "detalle": [detalle_cobro] # Acá metemos el detalle como lista
        }

    try:
        print(f"\n🚀 ENVIANDO A DUX PRODUCCIÓN ({tipo.upper()}):")
        print(json.dumps(payload, indent=2))
        
        respuesta = requests.post(url_destino, json=payload, headers=obtener_headers())
        
        datos_dux = respuesta.json()
        print(f"📥 RESPUESTA DE DUX (Status {respuesta.status_code}):")
        print(json.dumps(datos_dux, indent=2))
        
        if respuesta.status_code in [200, 201]:
            return {"status": "ok", "mensaje": f"{tipo.upper()} procesado correctamente."}
        else:
            return {"status": "error", "error": json.dumps(datos_dux)}
        
    except Exception as e:
        print("Error de conexión con DUX:", e)
        return {"status": "error", "error": str(e)}