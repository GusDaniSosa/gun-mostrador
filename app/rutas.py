from flask import request, jsonify
from app.base_datos import buscar_producto
from app.dux_api import gestionar_cliente  # Importamos la nueva función

def registrar_rutas(app):
    # RUTA 1: Búsqueda de Productos en SQLite local
    @app.route('/api/productos', methods=['GET'])
    def buscar():
        termino = request.args.get('q', '')
        if not termino:
            return jsonify({"error": "Falta el término de búsqueda (q)"}), 400
        
        resultados = buscar_producto(termino)
        return jsonify(resultados)

    # RUTA 2: Gestión de Clientes contra la API de DUX
    @app.route('/api/clientes', methods=['POST'])
    def procesar_cliente():
        datos = request.json
        dni = datos.get('dni')
        nombre = datos.get('nombre')
        
        if not dni or not nombre:
            return jsonify({"error": "DNI y Nombre son obligatorios"}), 400
        
        resultado = gestionar_cliente(dni, nombre)
        
        # Si hubo un error en la comunicación con DUX, devolvemos un estado 500
        if "error" in resultado:
            return jsonify(resultado), 500
            
        return jsonify(resultado), 200