import os
import json
import requests
import time
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
    
    observaciones_venta = datos_venta.get('observaciones', '').strip()

    cliente = datos_venta.get('cliente', {})
    id_cliente_final = cliente.get('id') or 14020175
    
    total_final = round(float(datos_venta.get('total_final', 0)), 2)
    fecha_actual = datetime.now().strftime('%Y-%m-%d')
    
    # Nuevas variables extraídas desde React para el Pago Mixto
    monto_efectivo = round(float(datos_venta.get('monto_efectivo', 0)), 2)
    monto_tarjeta = round(float(datos_venta.get('monto_tarjeta', 0)), 2)

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
        "id_cliente": int(id_cliente_final),                
        "descuento_global": float(descuento_global)
    }

    if observaciones_venta:
        payload["observaciones"] = observaciones_venta

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
            if 'inscripto' in cliente.get('categoria_iva', '').lower():
                payload["letra_comp"] = "A"
            else:
                payload["letra_comp"] = "B"
        elif tipo == 'comprobante_venta':
            payload["tipo_comp"] = "COMPROBANTE_VENTA"
            payload["letra_comp"] = "X"

    # ==========================================
    # LÓGICA DE COBRO (INCLUYENDO PAGO MIXTO)
    # ==========================================
    if tipo in ['comprobante_venta', 'factura'] and condicion_pago == 'CONTADO' and metodo_pago:
        detalles_de_cobro = []
        
        if metodo_pago == "EFECTIVO":
            detalles_de_cobro.append({
                "tipo_valor": "EFECTIVO",
                "monto": total_final
            })
            
        elif metodo_pago == "TARJETA":
            detalles_de_cobro.append({
                "tipo_valor": "TARJETA",
                "monto": total_final,
                "id_tarjeta": 15233,
                "id_plan_tarjeta": 1,
                "id_terminal": 6050,
                "nro_cupon": "000000",
                "nro_lote": "000"
            })
            
        elif metodo_pago == "MIXTO":
            # Si hay una parte en efectivo, armamos su detalle contable
            if monto_efectivo > 0:
                detalles_de_cobro.append({
                    "tipo_valor": "EFECTIVO",
                    "monto": monto_efectivo
                })
            # Si hay una parte en tarjeta, armamos su detalle contable
            if monto_tarjeta > 0:
                detalles_de_cobro.append({
                    "tipo_valor": "TARJETA",
                    "monto": monto_tarjeta,
                    "id_tarjeta": 15233,
                    "id_plan_tarjeta": 1,
                    "id_terminal": 6050,
                    "nro_cupon": "000000",
                    "nro_lote": "000"
                })
        
        # Inyectamos todos los detalles armados en la cuenta final de DUX
        payload["cobro"] = {
            "fecha_cobro": fecha_actual,
            "total": total_final,
            "id_caja": 19990,
            "id_moneda": 1,
            "cotiza_moneda": 1.0,
            "detalle": detalles_de_cobro 
        }

    try:
        respuesta = requests.post(url_destino, json=payload, headers=obtener_headers())
        datos_dux = respuesta.json()
        
        if respuesta.status_code in [200, 201]:
            id_comprobante = None
            if isinstance(datos_dux, dict) and 'datos' in datos_dux:
                id_comprobante = datos_dux['datos'].get('id_comp_venta') or datos_dux['datos'].get('id_presupuesto')
            
            return {
                "status": "ok", 
                "mensaje": "Creado en DUX",
                "id_dux": id_comprobante,
                "datos_originales": datos_dux
            }
        else:
            return {"status": "error", "error": json.dumps(datos_dux)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

def consultar_numero_comprobante(id_buscar, tipo, total_esperado=None):
    try:
        if tipo == "presupuesto":
            url_legal = f"{BASE_URL}/presupuestos/{id_buscar}?id_empresa={EMPRESA_ID}"
            res = requests.get(url_legal, headers=obtener_headers())
            if res.ok:
                datos_temporales = res.json()
                datos_internos = datos_temporales.get('datos', datos_temporales)
                if isinstance(datos_internos, list) and len(datos_internos) > 0:
                    datos_internos = datos_internos[0]
                    
                numero = datos_internos.get('nro_presupuesto')
                if numero is not None:
                    return {"numero": str(numero).zfill(8)}
            return {"numero": None}
        else:
            # BÚSQUEDA POR CLIENTE Y TOTAL PARA ASEGURARNOS DE AGARRAR LA FACTURA REAL
            fecha_hoy = datetime.now().strftime('%Y-%m-%d')
            url_rastreo = f"{BASE_URL}/facturas?id_empresa={EMPRESA_ID}&id_cliente={id_buscar}&fecha_desde={fecha_hoy}&fecha_hasta={fecha_hoy}"
            
            res = requests.get(url_rastreo, headers=obtener_headers())
            if res.ok:
                datos = res.json().get('datos', [])
                if not datos:
                    return {"numero": None}
                
                # Filtramos facturas que coincidan con el monto exacto de la venta actual
                if total_esperado:
                    try:
                        total_flt = float(total_esperado)
                        datos_filtrados = [f for f in datos if abs(float(f.get('total', 0)) - total_flt) < 0.1]
                        if datos_filtrados:
                            datos = datos_filtrados
                    except:
                        pass
                
                if not datos:
                    return {"numero": None}
                    
                datos.sort(key=lambda x: x.get('id', 0), reverse=True)
                ultima_factura = datos[0]
                
                cae = ultima_factura.get('nro_cae_cai')
                nro_comp = ultima_factura.get('nro_comp')
                
                if cae and str(cae).strip() and nro_comp:
                    letra = ultima_factura.get('letra_comp', 'B')
                    pto_vta = str(ultima_factura.get('nro_pto_vta', 6)).zfill(5)
                    nro = str(nro_comp).zfill(8)
                    numero_armado = f"{letra}-{pto_vta}-{nro}"
                    
                    return {
                        "numero": numero_armado,
                        "cae": str(cae),
                        "vto": ultima_factura.get('fecha_vencimiento_cae_cai')
                    }
            return {"numero": None}
    except Exception as e:
        return {"numero": None}