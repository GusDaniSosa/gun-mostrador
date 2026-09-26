import React, { useState, useEffect } from 'react';

export default function ModalCliente({ clienteAEditar, onClose, onGuardarExito }) {
    // Estado inicial del formulario
    const [formData, setFormData] = useState({
        apellido_razon_social: '',
        cuit_cuil: '',
        categoria_fiscal: 'CONSUMIDOR_FINAL'
    });
    const [cargando, setCargando] = useState(false);

    // Si abrimos el modal para EDITAR, cargamos los datos del cliente
    useEffect(() => {
        if (clienteAEditar) {
            setFormData({
                apellido_razon_social: clienteAEditar.nombre || '',
                cuit_cuil: clienteAEditar.cuit || '',
                categoria_fiscal: clienteAEditar.categoria_iva || 'CONSUMIDOR_FINAL'
            });
        }
    }, [clienteAEditar]);

    // Manejo de cambios en los inputs
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Envío de datos a tu servidor Python
    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        // Si existe clienteAEditar, usamos PUT (Actualizar). Si no, POST (Crear).
        const url = clienteAEditar 
            ? `http://192.168.88.250:5000/api/clientes/${clienteAEditar.id}` 
            : `http://192.168.88.250:5000/api/clientes`;
        const method = clienteAEditar ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(clienteAEditar ? 'Cliente actualizado en DUX' : 'Cliente creado en DUX');
                onGuardarExito(); // Ejecutamos la función para refrescar la pantalla
                onClose(); // Cerramos la ventana
            } else {
                alert(`Error de DUX: ${data.detalle || data.error}`);
            }
        } catch (error) {
            console.error("Error al conectar con Python:", error);
            alert("Error de conexión con el servidor local");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={estilos.overlay}>
            <div style={estilos.modal}>
                <h2>{clienteAEditar ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={estilos.campo}>
                        <label>Nombre o Razón Social (*):</label>
                        <input 
                            type="text" 
                            name="apellido_razon_social" 
                            value={formData.apellido_razon_social} 
                            onChange={handleChange} 
                            required 
                            style={estilos.input}
                        />
                    </div>

                    <div style={estilos.campo}>
                        <label>CUIT / DNI:</label>
                        <input 
                            type="text" 
                            name="cuit_cuil" 
                            value={formData.cuit_cuil} 
                            onChange={handleChange} 
                            style={estilos.input}
                        />
                    </div>

                    <div style={estilos.campo}>
                        <label>Condición IVA:</label>
                        <select 
                            name="categoria_fiscal" 
                            value={formData.categoria_fiscal} 
                            onChange={handleChange}
                            style={estilos.input}
                        >
                            <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                            <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                            <option value="MONOTRIBUTO">Monotributo</option>
                            <option value="EXENTO">Exento</option>
                        </select>
                    </div>

                    <div style={estilos.botones}>
                        <button type="button" onClick={onClose} disabled={cargando} style={estilos.btnCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={cargando} style={estilos.btnGuardar}>
                            {cargando ? 'Guardando...' : 'Guardar en DUX'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Estilos básicos en línea (podés reemplazarlos por tus clases CSS / Tailwind)
const estilos = {
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%' },
    campo: { marginBottom: '15px', display: 'flex', flexDirection: 'column' },
    input: { padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' },
    botones: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnCancelar: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#ccc', border: 'none', borderRadius: '4px' },
    btnGuardar: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }
};