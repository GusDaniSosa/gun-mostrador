import { useState, useEffect } from 'react';

// ==========================================
// FUNCIÓN PARA CALCULAR ALERTAS DE 24HS
// ==========================================
const obtenerEtiquetaCambio = (prod) => {
  if (!prod.fecha_actualizacion) return null;
  
  const fechaAct = new Date(prod.fecha_actualizacion);
  const ahora = new Date();
  const horasPasadas = (ahora - fechaAct) / (1000 * 60 * 60);

  if (horasPasadas > 24) return null; 

  const precioActual = parseFloat(prod.precio);
  const precioAnt = parseFloat(prod.precio_anterior);

  if (precioAnt === 0) {
    return <span className="ml-2 text-[10px] font-black bg-green-200 text-green-800 px-2 py-0.5 rounded border border-green-400 shadow-sm" title="Agregado recientemente al sistema">NUEVO 🆕</span>;
  } else if (precioActual > precioAnt) {
    return <span className="ml-2 text-[10px] font-black bg-red-200 text-red-800 px-2 py-0.5 rounded border border-red-400 shadow-sm" title={`Precio anterior: $${precioAnt.toFixed(2)}`}>SUBIÓ 📈</span>;
  } else if (precioActual < precioAnt) {
    return <span className="ml-2 text-[10px] font-black bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded border border-yellow-400 shadow-sm" title={`Precio anterior: $${precioAnt.toFixed(2)}`}>BAJÓ 📉</span>;
  } else {
    return <span className="ml-2 text-[10px] font-black bg-blue-200 text-blue-800 px-2 py-0.5 rounded border border-blue-400 shadow-sm" title="Se modificó la descripción del artículo">MODIFICADO ✏️</span>;
  }
};

// ==========================================
// TABLA DE INTERESES POR CUOTA (TARJETA)
// ==========================================
const tablaCuotas = [
  { cuotas: 1, interes: 0.00 },
  { cuotas: 2, interes: 8.76 },
  { cuotas: 3, interes: 11.45 },
  { cuotas: 4, interes: 15.80 },
  { cuotas: 5, interes: 18.54 },
  { cuotas: 6, interes: 22.36 },
  { cuotas: 7, interes: 24.98 },
  { cuotas: 8, interes: 27.48 },
  { cuotas: 9, interes: 29.86 },
  { cuotas: 10, interes: 32.14 },
  { cuotas: 11, interes: 34.31 },
  { cuotas: 12, interes: 36.38 },
  { cuotas: 13, interes: 38.36 },
  { cuotas: 14, interes: 40.25 },
  { cuotas: 15, interes: 42.06 },
  { cuotas: 16, interes: 43.78 },
  { cuotas: 17, interes: 45.44 },
  { cuotas: 18, interes: 47.02 },
  { cuotas: 19, interes: 48.53 },
  { cuotas: 20, interes: 49.98 },
  { cuotas: 21, interes: 51.37 },
  { cuotas: 22, interes: 52.70 },
  { cuotas: 23, interes: 53.98 },
  { cuotas: 24, interes: 55.20 }
];

// ==========================================
// MODAL PARA SUBIR FOTO A UN PRODUCTO (CON CTRL+V)
// ==========================================
const ModalSubirFoto = ({ producto, onClose, onExito }) => {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  // NUEVO: Escuchar el evento de pegar (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          setArchivo(file);
          setPreview(URL.createObjectURL(file));
          break; 
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const manejarSeleccion = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const subirAlServidor = async () => {
    if (!archivo) return;
    setSubiendo(true);
    
    const formData = new FormData();
    formData.append('foto', archivo);
    formData.append('codigo', producto.codigo);

    try {
      const res = await fetch('http://192.168.88.250:5000/api/upload_imagen', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert("✅ Foto subida y recortada mágicamente.");
        onExito(); 
        onClose();
      } else {
        alert("❌ Error al subir la foto.");
      }
    } catch (e) {
      alert("Fallo la conexión con Python.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[200]">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-xl font-black mb-2 text-blue-800 border-b pb-2">📸 Agregar Foto</h2>
        <p className="text-sm font-bold text-gray-700 mb-4">{producto.nombre}</p>
        
        {preview ? (
          <div className="mb-4">
            <img src={preview} alt="Vista previa" className="w-48 h-48 object-cover rounded-lg border-2 border-dashed border-blue-400 mx-auto" />
            <button onClick={() => { setArchivo(null); setPreview(null); }} className="text-red-500 text-xs font-bold mt-2 hover:underline">Quitar foto</button>
          </div>
        ) : (
          <div className="mb-4">
            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 text-blue-700 font-bold py-10 px-4 rounded-lg block">
              <span className="block mb-2 text-2xl">📋</span>
              PEGÁ (Ctrl+V) una imagen desde Google<br/>
              <span className="text-xs text-gray-500 mt-2 block">o hacé clic para buscar en la PC...</span>
              <input type="file" className="hidden" accept="image/*" onChange={manejarSeleccion} />
            </label>
          </div>
        )}

        <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
          <button onClick={onClose} disabled={subiendo} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 w-full">Cancelar</button>
          <button onClick={subirAlServidor} disabled={subiendo || !archivo} className="px-4 py-2 bg-blue-600 text-white font-black rounded shadow hover:bg-blue-700 disabled:bg-blue-300 w-full">
            {subiendo ? 'Enviando...' : 'Guardar Foto'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MODAL DE DICCIONARIO (MODO HÍBRIDO)
// ==========================================
const ModalDiccionario = ({ onClose }) => {
  const [modo, setModo] = useState('familia'); 
  const [terminoOficial, setTerminoOficial] = useState('');
  const [terminoCallejero, setTerminoCallejero] = useState('');
  const [busquedaExacta, setBusquedaExacta] = useState('');
  const [resultadosExactos, setResultadosExactos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const buscarExacto = async (texto) => {
    setBusquedaExacta(texto);
    if (texto.trim().length < 2) {
      setResultadosExactos([]);
      return;
    }
    try {
      const res = await fetch(`http://192.168.88.250:5000/api/productos?q=${texto}`);
      if (res.ok) {
        const datos = await res.json();
        setResultadosExactos(datos.resultados || []);
      }
    } catch (e) { console.error(e); }
  };

  const guardarSinonimo = async (e) => {
    e.preventDefault();
    let oficialFinal = '';
    if (modo === 'familia') {
      oficialFinal = terminoOficial.trim().toUpperCase();
    } else {
      if (!productoSeleccionado) return alert("⚠️ Seleccioná un producto de la lista primero.");
      oficialFinal = productoSeleccionado.nombre; 
    }

    if (!oficialFinal || !terminoCallejero.trim()) return alert("⚠️ Completá todos los campos.");
    
    setGuardando(true);
    try {
      const res = await fetch('http://192.168.88.250:5000/api/diccionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callejera: terminoCallejero.toLowerCase(), oficial: oficialFinal })
      });
      if (res.ok) {
        alert(modo === 'familia' ? "✅ Familia aprendida. Funcionará con todas las medidas." : "✅ Producto exacto aprendido.");
        onClose();
      } else { alert("❌ Error al guardar en la base de datos."); }
    } catch (error) { alert("Error de conexión con el servidor Python."); } 
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-black mb-4 text-blue-800 border-b pb-2">📖 Enseñar al Sistema</h2>
        
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button type="button" onClick={() => { setModo('familia'); setTerminoCallejero(''); }} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${modo === 'familia' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>📂 Familia (Varias medidas)</button>
          <button type="button" onClick={() => { setModo('exacto'); setTerminoCallejero(''); }} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${modo === 'exacto' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>🎯 Producto Exacto (Único)</button>
        </div>

        <form onSubmit={guardarSinonimo} className="flex flex-col gap-4">
          {modo === 'familia' ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-bold text-blue-800 block mb-1">Palabra Oficial (Ej: ENTRE ROSCA)</label>
              <input type="text" value={terminoOficial} onChange={(e) => setTerminoOficial(e.target.value.toUpperCase())} className="w-full p-2 border-2 border-blue-300 rounded-lg font-bold outline-none focus:border-blue-500 bg-white" placeholder="Ej: ENTRE ROSCA" autoFocus />
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 relative">
              <label className="text-xs font-bold text-green-800 block mb-1">Buscá el Producto Único Exacto</label>
              {productoSeleccionado ? (
                <div className="p-2 bg-white border-2 border-green-400 rounded-lg flex justify-between items-center shadow-sm">
                  <span className="font-bold text-green-900 text-xs">{productoSeleccionado.nombre}</span>
                  <button type="button" onClick={() => setProductoSeleccionado(null)} className="text-red-500 font-black hover:text-red-700 px-2">X</button>
                </div>
              ) : (
                <>
                  <input type="text" value={busquedaExacta} onChange={(e) => buscarExacto(e.target.value)} className="w-full p-2 border-2 border-green-300 rounded-lg font-bold outline-none focus:border-green-500 bg-white" placeholder="Escribí para buscar..." autoFocus />
                  {resultadosExactos.length > 0 && (
                    <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-2xl rounded-b-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {resultadosExactos.map((prod, idx) => (
                        <li key={idx} onClick={() => { setProductoSeleccionado(prod); setResultadosExactos([]); setBusquedaExacta(''); }} className="p-3 border-b hover:bg-green-50 cursor-pointer font-bold text-xs text-gray-800 flex justify-between">
                          <span>{prod.nombre}</span><span className="text-green-700">${prod.precio}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-2">
            <label className="text-xs font-bold text-orange-800 block mb-1">¿Cómo lo pide el cliente en el mostrador?</label>
            <input type="text" value={terminoCallejero} onChange={(e) => setTerminoCallejero(e.target.value.toLowerCase())} className="w-full p-3 border-2 border-orange-300 rounded-lg font-bold outline-none focus:border-orange-500 bg-white text-orange-900" placeholder="Ej: rosca con tuerca" />
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={guardando} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando || (!terminoOficial && !productoSeleccionado) || !terminoCallejero} className="px-6 py-2 bg-blue-600 text-white font-black rounded shadow hover:bg-blue-700 transition-colors disabled:bg-blue-300">
              {guardando ? 'Guardando...' : '💾 Aprender Sinónimo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODAL DE CLIENTE
// ==========================================
const ModalCliente = ({ clienteAEditar, onClose, onGuardarExito }) => {
  const [formData, setFormData] = useState({
    apellido_razon_social: '',
    nombre: '', 
    cuit_cuil: '',
    categoria_fiscal: 'CONSUMIDOR_FINAL',
    domicilio: '',
    localidad: '',
    provincia: ''
  });
  const [cargando, setCargando] = useState(false);
  const [idDestino, setIdDestino] = useState(null); 

  useEffect(() => {
    if (clienteAEditar) {
      setIdDestino(clienteAEditar.id);
      setFormData({
        apellido_razon_social: clienteAEditar.nombre || '',
        nombre: '', 
        cuit_cuil: clienteAEditar.cuit || '',
        categoria_fiscal: clienteAEditar.categoria_iva || 'CONSUMIDOR_FINAL',
        domicilio: clienteAEditar.domicilio || '',
        localidad: clienteAEditar.localidad || '',
        provincia: clienteAEditar.provincia || ''
      });
    } else {
      setIdDestino(null);
    }
  }, [clienteAEditar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const verificarCuitDux = async (cuit) => {
    if (cuit.length >= 10 && !idDestino) {
      try {
        const res = await fetch(`http://192.168.88.250:5000/api/clientes?q=${cuit}`);
        const data = await res.json();
        const existe = data.resultados?.find(c => c.cuit.replace(/\D/g, '') === cuit);
        
        if (existe) {
          if (window.confirm(`⚠ El CUIT ${cuit} ya está cargado:\n👤 ${existe.nombre}\n\n¿Cargar datos para editar?`)) {
            setIdDestino(existe.id);
            setFormData(prev => ({ 
              ...prev, 
              apellido_razon_social: existe.nombre, 
              categoria_fiscal: existe.categoria_iva 
            }));
          } else {
             setFormData(prev => ({ ...prev, cuit_cuil: '' }));
          }
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    const datosParaEnviar = {};
    for (let key in formData) {
      datosParaEnviar[key] = formData[key] === '' ? null : formData[key];
    }

    const url = idDestino ? `http://192.168.88.250:5000/api/clientes/${idDestino}` : `http://192.168.88.250:5000/api/clientes`;
    const method = idDestino ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar)
      });
      const data = await response.json();
      if (response.ok) {
        alert(idDestino ? '✅ Cliente actualizado con éxito' : '✅ Cliente creado en DUX');
        onGuardarExito(data.datos); 
        onClose();
      } else {
        alert(`❌ Error DUX: ${data.detalle || data.error}`);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-black mb-4 text-gray-800 border-b pb-2">
          {idDestino ? '✏ Editar Cliente' : '👤 Nuevo Cliente'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">CUIT / DNI</label>
            <input 
              type="text" name="cuit_cuil" value={formData.cuit_cuil} 
              onChange={(e) => setFormData({...formData, cuit_cuil: e.target.value.replace(/\D/g, '')})} 
              onBlur={(e) => verificarCuitDux(e.target.value.replace(/\D/g, ''))} 
              className="w-full p-2 border-2 rounded font-bold outline-none bg-blue-50 focus:border-blue-500" 
              placeholder="Ej: 20366062999" 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-600">Apellido / Razón Social *</label>
              <input type="text" name="apellido_razon_social" value={formData.apellido_razon_social} onChange={handleChange} required className="w-full p-2 border-2 rounded font-bold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Nombre</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border-2 rounded font-bold outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-600">Provincia</label>
              <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} className="w-full p-2 border-2 rounded font-bold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Localidad</label>
              <input type="text" name="localidad" value={formData.localidad} onChange={handleChange} className="w-full p-2 border-2 rounded font-bold outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">Domicilio</label>
            <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full p-2 border-2 rounded font-bold outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">Condición IVA</label>
            <select name="categoria_fiscal" value={formData.categoria_fiscal} onChange={handleChange} className="w-full p-2 border-2 rounded font-bold outline-none bg-white focus:border-blue-500">
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={cargando} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando} className="px-4 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 transition-colors">
              {cargando ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
function App() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [sugerencia, setSugerencia] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  
  const [mostrarModalABM, setMostrarModalABM] = useState(false);
  const [mostrarModalDiccionario, setMostrarModalDiccionario] = useState(false);
  const [traduccionActiva, setTraduccionActiva] = useState(null);

  const [productoParaSubirFoto, setProductoParaSubirFoto] = useState(null);
  const [imagenHover, setImagenHover] = useState(null); 

  const [clienteAEditar, setClienteAEditar] = useState(null);

  const [pendientes, setPendientes] = useState([]);
  const [mostrarPanelPendientes, setMostrarPanelPendientes] = useState(false);

  const [pantallaCarga, setPantallaCarga] = useState({ activo: false, mensaje: '' });
  const [ticketAImprimir, setTicketAImprimir] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);

  const clientePorDefecto = { nombre: "Consumidor Final", cuit: "00000000", categoria_iva: "Consumidor Final", id: 14020175 };
  const [clienteActual, setClienteActual] = useState(clientePorDefecto);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [mostrarBuscadorCliente, setMostrarBuscadorCliente] = useState(false);

  const [vendedor, setVendedor] = useState(null);
  const [condicionPago, setCondicionPago] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(1);

  const listaVendedores = [
    { id: 6257259, nombre: "PABLO" },
    { id: 15543779, nombre: "MAURICIO" },
    { id: 6257260, nombre: "VALENTÍN" }
  ];

  useEffect(() => {
    const guardados = localStorage.getItem('facturasPendientes');
    if (guardados) setPendientes(JSON.parse(guardados));
  }, []);

  useEffect(() => {
    const checkPendientes = async () => {
      if (pendientes.filter(p => p.estado === 'procesando').length === 0) return;

      let actualizados = false;
      const nuevosPendientes = await Promise.all(pendientes.map(async (p) => {
         if (p.estado === 'procesando') {
            try {
              const ts = new Date().getTime(); 
              const res = await fetch(`http://192.168.88.250:5000/api/rastrear_numero?id=${p.idCliente}&tipo=${p.ticketData.tipo_crudo}&total=${p.ticketData.total}&_t=${ts}`);
              if (res.ok) {
                 const data = await res.json();
                 if (data.numero && data.cae && data.numero !== "S/N") {
                    actualizados = true;
                    return { 
                        ...p, 
                        estado: 'listo', 
                        ticketData: { 
                            ...p.ticketData, 
                            numero_dux: data.numero, 
                            cae: data.cae, 
                            vto: data.vto 
                        } 
                    };
                 }
              }
            } catch(e) {}
         }
         return p;
      }));

      if (actualizados) {
         setPendientes(nuevosPendientes);
         localStorage.setItem('facturasPendientes', JSON.stringify(nuevosPendientes));
      }
    };

    const interval = setInterval(checkPendientes, 15000);
    return () => clearInterval(interval);
  }, [pendientes]);

  const imprimirPendiente = (itemPendiente) => {
      setTicketAImprimir(itemPendiente.ticketData);
      setMostrarPanelPendientes(false);
      setTimeout(() => { window.print(); }, 500);
      
      const filtrados = pendientes.filter(p => p.id !== itemPendiente.id);
      setPendientes(filtrados);
      localStorage.setItem('facturasPendientes', JSON.stringify(filtrados));
  };

  const borrarPendiente = (id) => {
      if(window.confirm("¿Seguro que querés borrar este registro pendiente?")) {
          const filtrados = pendientes.filter(p => p.id !== id);
          setPendientes(filtrados);
          localStorage.setItem('facturasPendientes', JSON.stringify(filtrados));
      }
  };

  const ejecutarSincronizacionManual = async () => {
    if (!window.confirm("¿Descargar precios actualizados desde DUX?\n\nEsto se hará de fondo para no trabar la caja. Puede demorar hasta 10 minutos en actualizar los 19.000 artículos.")) return;
    
    setSincronizando(true);
    try {
      const res = await fetch('http://192.168.88.250:5000/api/sincronizar', { method: 'POST' });
      if (res.ok) alert("✅ Sincronización en marcha. Podés seguir facturando. Las etiquetas de alerta aparecerán solas.");
      else alert("❌ Ocurrió un error al intentar despertar el sincronizador.");
    } catch (e) { alert("Error de conexión. ¿Está prendido el servidor Python?"); }
    setTimeout(() => setSincronizando(false), 8000);
  };

  const ejecutarBusqueda = async (texto) => {
    try {
      const respuesta = await fetch(`http://192.168.88.250:5000/api/productos?q=${texto}`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setResultados(datos.resultados || []);
        setSugerencia(datos.sugerencia || null);
        setTraduccionActiva(datos.traduccion || null);
      }
    } catch (error) { console.error("Error backend:", error); }
  };

  const manejarEscritura = (evento) => {
    const texto = evento.target.value;
    setBusqueda(texto);
    if (texto.trim() === '') {
      setResultados([]);
      setSugerencia(null);
      setTraduccionActiva(null);
      return;
    }
    ejecutarBusqueda(texto);
  };

  const aplicarSugerencia = () => {
    setBusqueda(sugerencia);
    ejecutarBusqueda(sugerencia);
  };

  const manejarTeclado = (evento) => {
    if (evento.key === 'F1') {
      evento.preventDefault(); 
      if (sugerencia) aplicarSugerencia();
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.codigo === producto.codigo);
    if (existe) {
      setCarrito(carrito.map(item =>
        item.codigo === producto.codigo ? { ...item, cantidad: parseFloat(item.cantidad) + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { 
        ...producto, 
        cantidad: 1, 
        precio_original: parseFloat(producto.precio),
        precio_cobrado: parseFloat(producto.precio).toFixed(2), 
        descuento: 0,
        iva: parseFloat(producto.iva) || 21 
      }]);
    }
    setBusqueda('');
    setResultados([]);
    setSugerencia(null);
    setTraduccionActiva(null);
  };

  const modificarItem = (codigo, campo, valor) => {
    setCarrito(carrito.map(item => {
      if (item.codigo !== codigo) return item;
      let nuevoItem = { ...item, [campo]: valor };
      if (valor === '') return nuevoItem;

      const numValor = parseFloat(valor);
      if (!isNaN(numValor)) {
        if (campo === 'descuento') {
          nuevoItem.precio_cobrado = (item.precio_original * (1 - (numValor / 100))).toFixed(2);
        } else if (campo === 'precio_cobrado') {
          if (item.precio_original > 0) {
            if (numValor > item.precio_original) nuevoItem.descuento = 0;
            else nuevoItem.descuento = (((item.precio_original - numValor) / item.precio_original) * 100).toFixed(2);
          }
        }
      }
      return nuevoItem;
    }));
  };

  const eliminarItem = (codigo) => {
    setCarrito(carrito.filter(item => item.codigo !== codigo));
  };

  const calcularSubtotalItem = (item) => {
    return (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_cobrado) || 0);
  };

  const subtotalCarrito = carrito.reduce((sum, item) => sum + calcularSubtotalItem(item), 0);
  const totalConDescuento = subtotalCarrito * (1 - ((parseFloat(descuentoTotal) || 0) / 100));

  const interesActual = (condicionPago === 'CONTADO' && metodoPago === 'TARJETA') 
    ? (tablaCuotas.find(c => c.cuotas === cuotasSeleccionadas)?.interes || 0) 
    : 0;

  const montoRecargoTarjeta = totalConDescuento * (interesActual / 100);
  const totalFinalCalculado = totalConDescuento + montoRecargoTarjeta;
  const valorCuota = cuotasSeleccionadas > 0 ? (totalFinalCalculado / cuotasSeleccionadas) : totalFinalCalculado;

  const ejecutarBusquedaCliente = async (texto) => {
    try {
      const respuesta = await fetch(`http://192.168.88.250:5000/api/clientes?q=${texto}`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setResultadosCliente(datos.resultados || []);
      }
    } catch (error) { console.error("Error buscando cliente:", error); }
  };

  const manejarEscrituraCliente = (evento) => {
    const texto = evento.target.value;
    setBusquedaCliente(texto);
    if (texto.trim().length < 2) {
      setResultadosCliente([]);
      return;
    }
    ejecutarBusquedaCliente(texto);
  };

  const seleccionarCliente = (cliente) => {
    setClienteActual(cliente);
    setBusquedaCliente('');
    setResultadosCliente([]);
    setMostrarBuscadorCliente(false);
  };

  const finalizarVenta = async (tipo_comprobante) => {
    if (carrito.length === 0) return;
    if (!vendedor) return alert("⚠️ Seleccioná el VENDEDOR.");
    if (tipo_comprobante === 'comprobante_venta' || tipo_comprobante === 'factura') {
      if (!condicionPago) return alert("⚠️ Seleccioná la CONDICIÓN DE PAGO.");
      if (condicionPago === 'CONTADO' && !metodoPago) return alert("⚠️ Indicá EFECTIVO o TARJETA.");
    }

    let carritoProcesado = carrito;
    let subtotalProcesado = subtotalCarrito;

    if (interesActual > 0) {
      const factorRecargo = 1 + (interesActual / 100);
      carritoProcesado = carrito.map(item => ({
        ...item,
        precio_cobrado: (parseFloat(item.precio_cobrado) * factorRecargo).toFixed(2)
      }));
      subtotalProcesado = carritoProcesado.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_cobrado)), 0);
    }

    const totalFinalDux = subtotalProcesado * (1 - ((parseFloat(descuentoTotal) || 0) / 100));

    const paquete_dux = {
      tipo: tipo_comprobante,
      cliente: clienteActual,
      items: carritoProcesado,
      descuento_total: descuentoTotal,
      id_personal: vendedor,
      condicion_pago: condicionPago, 
      metodo_pago: metodoPago,       
      total_final: totalFinalDux.toFixed(2),
      observaciones: observaciones 
    };

    setPantallaCarga({ activo: true, mensaje: 'Guardando en DUX...' });

    try {
      const respuesta = await fetch('http://192.168.88.250:5000/api/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paquete_dux)
      });
      
      const datos_respuesta = await respuesta.json();
      
      if (datos_respuesta.status === 'ok') {
        const idDuxGenerado = datos_respuesta.id_dux;
        const datosOriginales = datos_respuesta.datos_originales?.datos || {};
        
        if (!idDuxGenerado) {
             alert("⚠️ Venta guardada, pero DUX no devolvió ID interno.");
             setPantallaCarga({ activo: false, mensaje: '' });
             return;
        }

        if (tipo_comprobante === 'factura') {
            const nuevoPendiente = {
               id: Date.now(),
               idCliente: clienteActual.id || 14020175, 
               estado: 'procesando',
               ticketData: {
                  fecha: new Date().toLocaleString('es-AR'),
                  tipo_crudo: tipo_comprobante,
                  tipo: String(clienteActual?.categoria_iva || '').toLowerCase().includes('inscripto') ? 'FACTURA A' : 'FACTURA B',
                  cliente: clienteActual,
                  vendedor: listaVendedores.find(v => v.id === vendedor)?.nombre || 'Vendedor',
                  items: [...carritoProcesado],
                  subtotal: subtotalProcesado,
                  descuento: descuentoTotal,
                  total: totalFinalDux,
                  numero_dux: 'S/N',
                  cae: null,
                  vto: null,
                  observaciones: observaciones 
               }
            };

            const nuevaLista = [...pendientes, nuevoPendiente];
            setPendientes(nuevaLista);
            localStorage.setItem('facturasPendientes', JSON.stringify(nuevaLista));

            setCarrito([]);
            setDescuentoTotal(0);
            setBusqueda('');
            setResultados([]);
            setCondicionPago(null); 
            setMetodoPago(null); 
            setCuotasSeleccionadas(1);
            setObservaciones('');
            setClienteActual(clientePorDefecto);
            setPantallaCarga({ activo: false, mensaje: '' });
            return; 

        } else {
            let tituloTicket = 'COMPROBANTE';
            let numeroTicket = 'S/N';

            if (tipo_comprobante === 'presupuesto') {
                tituloTicket = 'PRESUPUESTO';
                numeroTicket = datosOriginales.nro_presupuesto ? String(datosOriginales.nro_presupuesto).padStart(8, '0') : (datosOriginales.comprobante || `ID-${idDuxGenerado}`);
            } else if (tipo_comprobante === 'comprobante_venta') {
                tituloTicket = 'C. VENTA (INTERNO)';
                numeroTicket = datosOriginales.comprobante || `ID-${idDuxGenerado}`;
            }

            setTicketAImprimir({
              fecha: new Date().toLocaleString('es-AR'),
              tipo_crudo: tipo_comprobante,
              tipo: tituloTicket,
              cliente: clienteActual,
              vendedor: listaVendedores.find(v => v.id === vendedor)?.nombre || 'Vendedor',
              items: [...carritoProcesado],
              subtotal: subtotalProcesado,
              descuento: descuentoTotal,
              total: totalFinalDux,
              numero_dux: numeroTicket,
              observaciones: observaciones 
            });

            setCarrito([]);
            setDescuentoTotal(0);
            setBusqueda('');
            setResultados([]);
            setCondicionPago(null); 
            setMetodoPago(null); 
            setCuotasSeleccionadas(1);
            setObservaciones('');
            setClienteActual(clientePorDefecto);
            setPantallaCarga({ activo: false, mensaje: '' });

            setTimeout(() => { window.print(); }, 800);
        }

      } else {
        alert("❌ Error: " + datos_respuesta.error);
        setPantallaCarga({ activo: false, mensaje: '' });
      }
      
    } catch (error) {
      alert("Hubo un error de red al enviar la venta al servidor local.");
      setPantallaCarga({ activo: false, mensaje: '' });
    } 
  };

  return (
    <>
      {pantallaCarga.activo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-[200] text-white">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-white mb-6"></div>
          <h2 className="text-3xl font-black mb-2 animate-pulse text-green-400">Procesando Venta...</h2>
          <p className="text-xl text-gray-300 font-bold mb-1">{pantallaCarga.mensaje}</p>
        </div>
      )}

      {mostrarPanelPendientes && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[150] print:hidden">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h2 className="text-2xl font-black text-gray-800">Facturas Pendientes</h2>
                  <button onClick={() => setMostrarPanelPendientes(false)} className="text-red-600 font-black text-xl hover:text-red-800">X</button>
              </div>
              
              {pendientes.length === 0 ? (
                  <p className="text-center text-gray-500 font-bold py-10">No hay facturas procesando.</p>
              ) : (
                  <div className="space-y-3">
                      {pendientes.map((p, index) => (
                          <div key={index} className={`p-4 border-2 rounded-xl flex justify-between items-center shadow-sm ${p.estado === 'listo' ? 'border-green-500 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                              <div>
                                  <p className="font-bold text-lg">{p.ticketData.cliente.nombre}</p>
                                  <p className="text-sm text-gray-600">Total: ${p.ticketData.total} | Tipo: {p.ticketData.tipo}</p>
                                  {p.estado === 'procesando' ? (
                                      <p className="text-orange-600 font-bold mt-1 text-xs animate-pulse">⏳ Esperando CAE desde AFIP...</p>
                                  ) : (
                                      <p className="text-green-700 font-bold mt-1 text-xs">✅ Nro: {p.ticketData.numero_dux} | CAE Listo</p>
                                  )}
                              </div>
                              <div className="flex gap-2">
                                  {p.estado === 'listo' && (
                                      <button onClick={() => imprimirPendiente(p)} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded shadow">🖨 Imprimir</button>
                                  )}
                                  <button onClick={() => borrarPendiente(p.id)} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-2 rounded shadow-sm">Borrar</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>
      )}

      {imagenHover && (
        <div 
          className="fixed pointer-events-none z-[300] bg-white p-2 rounded-xl shadow-2xl border-4 border-blue-400"
          style={{ 
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '400px', height: '400px'
          }}
        >
          <img 
            src={`http://192.168.88.250:5000/imagenes/${imagenHover}.webp`} 
            alt="Producto" 
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="min-h-screen bg-gray-200 p-2 md:p-4 font-sans flex flex-col md:flex-row gap-4 touch-manipulation print:hidden">
        
        <div className="flex-[7] bg-white rounded-xl shadow-lg flex flex-col h-[95vh] relative">
          <div className="bg-blue-700 p-4 text-white rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-4">
               <h1 className="text-2xl font-black">GUN - Mostrador</h1>
               <button onClick={ejecutarSincronizacionManual} disabled={sincronizando} className={`px-3 py-1 text-sm font-bold rounded transition-colors shadow-sm border border-blue-500 ${sincronizando ? 'bg-blue-800 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                  {sincronizando ? '⏳ Sincronizando...' : '🔄 Actualizar Precios'}
               </button>
               <button onClick={() => setMostrarModalDiccionario(true)} className="px-3 py-1 text-sm font-bold rounded transition-colors shadow-sm bg-blue-900 border border-blue-800 hover:bg-blue-800 text-blue-100">
                  📖 Enseñar Sinónimo
               </button>
            </div>
            
            <button onClick={() => setMostrarPanelPendientes(true)} className={`font-bold px-4 py-2 rounded shadow-md border-2 transition-colors ${pendientes.some(p => p.estado === 'listo') ? 'bg-green-500 hover:bg-green-600 border-white text-white animate-bounce' : pendientes.length > 0 ? 'bg-orange-500 hover:bg-orange-600 border-white text-white' : 'bg-blue-800 text-blue-300 border-transparent'}`}>
               ⏳ Facturas Pendientes ({pendientes.length})
            </button>
          </div>
          
          <div className="p-4 border-b relative z-20">
            <input type="text" placeholder="Escriba para buscar código o producto..." className="w-full p-4 text-2xl border-2 rounded-xl focus:outline-none focus:border-blue-600" value={busqueda} onChange={manejarEscritura} onKeyDown={manejarTeclado} autoFocus />
            
            {(resultados.length > 0 || sugerencia || busqueda.trim() !== '') && (
              <div className="absolute top-full left-0 w-full bg-white shadow-2xl z-50 max-h-[50vh] overflow-y-auto border border-gray-300 rounded-b-xl">
                
                {traduccionActiva && (
                  <div className="bg-blue-100 p-2 text-blue-800 text-center font-bold text-sm border-b border-blue-200">
                    💡 Entendimos que buscabas: <span className="font-black text-blue-900">{traduccionActiva}</span>
                  </div>
                )}

                {resultados.length === 0 ? (
                  <div className="p-4 flex flex-col items-center justify-center">
                    {sugerencia ? (
                      <div className="text-center bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <p className="text-gray-500 text-lg mb-2">No encontramos nada exacto.</p>
                        <p className="text-xl flex items-center justify-center">
                          ¿Quisiste decir <button onClick={aplicarSugerencia} className="text-blue-700 font-black text-2xl hover:underline bg-white px-3 py-1 rounded shadow-sm border mx-2">{sugerencia}</button>? 
                        </p>
                      </div>
                    ) : ( <div className="text-gray-400 text-lg">Buscando...</div> )}
                  </div>
                ) : (
                  <ul className="space-y-1 p-2">
                    {resultados.map((prod, index) => (
                      <li key={index} className="p-2 bg-white border-b hover:bg-gray-50 flex justify-between items-center group">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => agregarAlCarrito(prod)}
                        >
                          <div className="font-bold text-lg text-gray-800 flex items-center">
                              {prod.nombre}
                              {obtenerEtiquetaCambio(prod)}
                          </div>
                          <p className="text-sm text-gray-500">Cód: {prod.codigo}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <button 
                            className={`p-2 rounded-full transition-all ${prod.tiene_imagen ? 'text-blue-500 bg-blue-50 border border-blue-200 shadow-sm hover:scale-110' : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'}`}
                            title={prod.tiene_imagen ? 'Ver foto' : 'Subir foto para este producto'}
                            onMouseEnter={() => { if(prod.tiene_imagen) setImagenHover(prod.codigo.trim()); }}
                            onMouseLeave={() => setImagenHover(null)}
                            onClick={(e) => {
                              e.stopPropagation(); 
                              if(!prod.tiene_imagen) setProductoParaSubirFoto(prod);
                            }}
                          >
                            📸
                          </button>
                          
                          <div className="text-2xl font-black text-green-700 mr-2" onClick={() => agregarAlCarrito(prod)} style={{cursor: "pointer"}}>${parseFloat(prod.precio).toFixed(2)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 z-10">
            {carrito.length === 0 ? (
               <div className="text-center text-gray-400 text-xl font-bold mt-10">El carrito está vacío</div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item, i) => {
                  const precioCobrado = parseFloat(item.precio_cobrado) || 0;
                  const precioOriginal = parseFloat(item.precio_original) || 0;
                  const diferencia = precioCobrado - precioOriginal;

                  return (
                    <div key={i} className="p-3 bg-white border rounded-lg flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-lg">{item.nombre}</span>
                          {diferencia < -0.01 && <span className="text-xs text-orange-500 font-bold">Precio original: ${precioOriginal.toFixed(2)}</span>}
                          {diferencia > 0.01 && <span className="text-xs text-red-600 font-bold">Recargo manual: +${diferencia.toFixed(2)}</span>}
                        </div>
                        <button onClick={() => eliminarItem(item.codigo)} className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded hover:bg-red-200">X</button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-bold mb-1">Cant.</span>
                          <input type="number" className="w-16 p-2 border rounded text-center font-bold bg-gray-50" value={item.cantidad} onChange={(e) => modificarItem(item.codigo, 'cantidad', e.target.value)} onFocus={(e) => e.target.select()} min="1" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-blue-600 font-bold mb-1">Precio Final ($)</span>
                          <input type="number" step="0.01" className="w-24 p-2 border border-blue-200 bg-blue-50 rounded font-bold text-blue-800" value={item.precio_cobrado} onChange={(e) => modificarItem(item.codigo, 'precio_cobrado', e.target.value)} onFocus={(e) => e.target.select()} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-orange-600 font-bold mb-1">Desc. (%)</span>
                          <input type="number" step="0.01" className="w-20 p-2 border border-orange-200 bg-orange-50 rounded font-bold text-orange-700 text-center" value={item.descuento} onChange={(e) => modificarItem(item.codigo, 'descuento', e.target.value)} onFocus={(e) => e.target.select()} />
                        </div>
                        <div className="ml-auto flex flex-col items-end">
                          <span className="text-xs text-gray-500 font-bold mb-1">Subtotal</span>
                          <span className="font-black text-xl text-green-700">${calcularSubtotalItem(item).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-[3] bg-white rounded-xl shadow-lg flex flex-col h-[95vh] p-4 overflow-y-auto">
          
          <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 mb-4 relative z-30">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-gray-500 tracking-wider">CLIENTE</span>
               <div className="flex gap-1">
                 <button onClick={() => { setClienteAEditar(null); setMostrarModalABM(true); }} className="bg-green-100 text-green-700 hover:bg-green-200 font-black px-2 py-1 rounded shadow-sm border border-green-300">+</button>
                 <button onClick={() => { setMostrarBuscadorCliente(!mostrarBuscadorCliente); if (!mostrarBuscadorCliente) setTimeout(() => document.getElementById('input-cliente').focus(), 100); }} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-100 px-2 py-1 rounded shadow-sm border border-blue-200">
                   {mostrarBuscadorCliente ? '❌ Cancelar' : '🔍 Buscar'}
                 </button>
               </div>
             </div>

             {mostrarBuscadorCliente ? (
               <div className="mt-2 relative">
                 <input id="input-cliente" type="text" placeholder="DNI, CUIT o Nombre..." className="w-full p-2 border-2 border-blue-400 rounded-lg focus:outline-none font-bold" value={busquedaCliente} onChange={manejarEscrituraCliente} />
                 {resultadosCliente.length > 0 && (
                   <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-2xl rounded-b-lg mt-1 max-h-48 overflow-y-auto z-50">
                     {resultadosCliente.map((cli, idx) => (
                       <li key={idx} onClick={() => seleccionarCliente(cli)} className="p-3 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                         <div>
                           <div className="font-bold text-gray-800 text-sm">{cli.nombre}</div>
                           <div className="text-xs text-gray-500 mt-1">CUIT: {cli.cuit} | {cli.categoria_iva}</div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setClienteAEditar(cli); setMostrarModalABM(true); }} className="text-gray-400 hover:text-orange-600 p-2">✏️</button>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
             ) : (
               <>
                 <div className="flex justify-between items-start">
                   <div className="text-lg font-black text-gray-800 truncate pr-2" title={clienteActual.nombre}>{clienteActual.nombre}</div>
                   {clienteActual.cuit !== '00000000' && (
                     <button onClick={() => setClienteActual(clientePorDefecto)} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded shadow-sm border border-red-200 font-bold text-xs">✖ Quitar</button>
                   )}
                 </div>
                 <div className="flex justify-between mt-1 items-center">
                   <span className="text-sm text-gray-600 font-bold">CUIT: {clienteActual.cuit}</span>
                   <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded border border-gray-300 truncate max-w-[120px]">{clienteActual.categoria_iva}</span>
                 </div>
               </>
             )}
          </div>

          <div className="flex flex-col gap-2 border-b pb-4 mb-4">
            <span className="font-bold text-gray-800 uppercase tracking-wide text-sm">Vendedor:</span>
            <div className="grid grid-cols-3 gap-2">
              {listaVendedores.map(v => (
                <button key={v.id} onClick={() => setVendedor(v.id)} className={`px-1 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm ${vendedor === v.id ? 'bg-blue-800 text-white border-2 border-blue-900' : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'}`}>
                  {v.nombre}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center text-gray-600 font-bold px-2">
              <span>Subtotal Bruto:</span>
              <span>${subtotalCarrito.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center bg-orange-100 p-2 rounded-lg border border-orange-200">
              <span className="font-bold text-orange-800 text-sm">Descuento Local (%)</span>
              <input type="number" step="0.01" className="w-20 p-1 border border-orange-300 rounded text-right font-bold text-orange-700" value={descuentoTotal} onChange={(e) => setDescuentoTotal(e.target.value)} onFocus={(e) => e.target.select()} />
            </div>

            <div className="flex flex-col bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm mt-2">
              <span className="text-lg font-bold text-blue-900">TOTAL A PAGAR</span>
              <span className="text-4xl font-black text-blue-700 text-right">${totalFinalCalculado.toFixed(2)}</span>
              {montoRecargoTarjeta > 0 && (
                <span className="text-xs font-bold text-purple-700 text-right mt-1">
                  (Incluye +${montoRecargoTarjeta.toFixed(2)} de recargo por tarjeta)
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex flex-col gap-3">
            
            <div className="flex flex-col bg-yellow-50 p-2 rounded-lg border border-yellow-200">
              <span className="font-bold text-yellow-800 uppercase text-[10px] mb-1 tracking-wide">📝 Observaciones del Pedido (Opcional)</span>
              <textarea 
                className="w-full p-2 border border-yellow-300 rounded text-sm bg-white focus:outline-none focus:border-yellow-500" 
                rows="1" 
                placeholder="Ej: Entregar a las 17hs, Lleva el fletero..." 
                value={observaciones} 
                onChange={(e) => setObservaciones(e.target.value)}
              ></textarea>
            </div>

            <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 uppercase text-xs">Condición:</span>
              <div className="flex gap-2">
                <button onClick={() => { setCondicionPago('CONTADO'); setMetodoPago(null); setCuotasSeleccionadas(1); }} className={`flex-1 py-2 rounded font-bold shadow-sm text-xs border ${condicionPago === 'CONTADO' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-700'}`}>CONTADO</button>
                <button onClick={() => { setCondicionPago('CUENTA_CORRIENTE'); setMetodoPago(null); setCuotasSeleccionadas(1); }} className={`flex-1 py-2 rounded font-bold shadow-sm text-xs border ${condicionPago === 'CUENTA_CORRIENTE' ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-700'}`}>CTA. CORRIENTE</button>
              </div>
            </div>

            {condicionPago === 'CONTADO' && (
              <div className="flex flex-col gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-900 uppercase text-xs">Método:</span>
                <div className="flex gap-2">
                  <button onClick={() => { setMetodoPago('EFECTIVO'); setCuotasSeleccionadas(1); }} className={`flex-1 py-2 rounded font-bold shadow-sm text-xs border ${metodoPago === 'EFECTIVO' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-800'}`}>EFECTIVO</button>
                  <button onClick={() => { setMetodoPago('TARJETA'); setCuotasSeleccionadas(1); }} className={`flex-1 py-2 rounded font-bold shadow-sm text-xs border ${metodoPago === 'TARJETA' ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-purple-800'}`}>TARJETA</button>
                </div>
              </div>
            )}

            {condicionPago === 'CONTADO' && metodoPago === 'TARJETA' && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 shadow-inner">
                <span className="font-bold text-purple-900 text-xs uppercase block mb-1">Seleccione Cuotas:</span>
                <select 
                  className="w-full p-2 border-2 border-purple-300 rounded font-black text-purple-900 bg-white focus:outline-none focus:border-purple-500"
                  value={cuotasSeleccionadas}
                  onChange={(e) => setCuotasSeleccionadas(parseInt(e.target.value))}
                >
                  {tablaCuotas.map(c => (
                    <option key={c.cuotas} value={c.cuotas}>
                      {c.cuotas} {c.cuotas === 1 ? 'Pago' : 'Cuotas'} {c.interes > 0 ? `(+${c.interes}%)` : '(Sin interés)'}
                    </option>
                  ))}
                </select>

                {cuotasSeleccionadas > 1 && (
                  <div className="mt-2 text-center bg-white p-2 rounded border border-purple-200">
                    <span className="block text-xs text-purple-600 font-bold uppercase">El cliente abonará</span>
                    <span className="block text-xl font-black text-purple-800">
                      {cuotasSeleccionadas} cuotas de ${valorCuota.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => finalizarVenta('presupuesto')} disabled={pantallaCarga.activo || carrito.length === 0} className={`p-3 rounded-lg font-bold text-xs text-white shadow-md ${carrito.length > 0 ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300'}`}>PRESUPUESTO</button>
              <button onClick={() => finalizarVenta('comprobante_venta')} disabled={pantallaCarga.activo || carrito.length === 0} className={`p-3 rounded-lg font-bold text-xs text-white shadow-md ${carrito.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'}`}>C. VENTA</button>
              <button onClick={() => finalizarVenta('factura')} disabled={pantallaCarga.activo || carrito.length === 0} className={`col-span-2 p-3 rounded-lg font-bold text-sm text-white shadow-md ${carrito.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300'}`}>
                {String(clienteActual?.categoria_iva || '').toLowerCase().includes('inscripto') ? 'FACTURA A' : 'FACTURA B'}
              </button>
            </div>
          </div>

        </div>
        
        {mostrarModalABM && (
          <ModalCliente clienteAEditar={clienteAEditar} onClose={() => setMostrarModalABM(false)} onGuardarExito={(datosFrescos) => { if (datosFrescos) setClienteActual(datosFrescos); }} />
        )}
        
        {mostrarModalDiccionario && (
          <ModalDiccionario onClose={() => setMostrarModalDiccionario(false)} />
        )}

        {/* --- MODAL PARA SUBIR FOTO --- */}
        {productoParaSubirFoto && (
          <ModalSubirFoto 
            producto={productoParaSubirFoto} 
            onClose={() => setProductoParaSubirFoto(null)} 
            onExito={() => {
              ejecutarBusqueda(busqueda);
            }} 
          />
        )}

      </div>

      {/* ==========================================
          TICKET TÉRMICO (Multiformato)
          ========================================== */}
      {ticketAImprimir && (
        <div className="hidden print:block text-black font-mono text-sm bg-white" style={{ width: '80mm', margin: '0', padding: '0', lineHeight: '1.2' }}>
          
          {(ticketAImprimir.tipo_crudo === 'comprobante_venta' || ticketAImprimir.tipo_crudo === 'presupuesto') && (
            <div className="pt-2">
              <div className="text-xs uppercase mb-2 leading-tight">
                <p>CLIENTE: {ticketAImprimir.cliente.nombre}</p>
                <p>CATEGORIA FISCAL: {ticketAImprimir.cliente.categoria_iva}</p>
                <p className="font-bold">{ticketAImprimir.tipo}: {ticketAImprimir.numero_dux}</p>
                <p>FECHA: {ticketAImprimir.fecha.split(',')[0].trim()} &nbsp;&nbsp; HORA: {ticketAImprimir.fecha.split(',')[1].trim().substring(0, 5)}</p>
              </div>

              <p className="border-t border-black border-dashed mb-1"></p>
              <div className="text-xs w-full mb-1">
                <p>Cant. x Precio Unit.</p>
                <div className="flex justify-between">
                  <p>Descripcion</p>
                  <p>Total</p>
                </div>
              </div>
              <p className="border-b border-black border-dashed mb-1"></p>

              <div className="text-xs mb-2">
                {ticketAImprimir.items.map((item, i) => {
                   let precioMuestra = parseFloat(item.precio_cobrado);
                   let subtotalItem = parseFloat(item.cantidad) * precioMuestra;
                   
                   return (
                    <div key={i} className="mb-1">
                      <p>{parseFloat(item.cantidad).toFixed(2).replace('.', ',')} x {precioMuestra.toFixed(2).replace('.', ',')}</p>
                      <div className="flex justify-between">
                        <p className="truncate max-w-[200px]">{item.nombre.toUpperCase()}</p>
                        <p>$ {subtotalItem.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="border-t border-black border-dashed mb-1"></p>
              <div className="text-xs uppercase space-y-1">
                <div className="flex justify-between">
                  <p>SUBTOTAL:</p>
                  <p>$ {ticketAImprimir.subtotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex justify-between">
                  <p>DESCUENTO:</p>
                  <p>$ {((ticketAImprimir.subtotal * (ticketAImprimir.descuento / 100)) || 0).toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex justify-between mt-1">
                  <p>TOTAL:</p>
                  <p>$ {ticketAImprimir.total.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              {ticketAImprimir.observaciones && ticketAImprimir.observaciones.trim() !== '' && (
                <div className="text-xs mt-3 border-t border-black border-dashed pt-1">
                  <p className="font-bold">OBSERVACIONES:</p>
                  <p className="whitespace-pre-wrap">{ticketAImprimir.observaciones.toUpperCase()}</p>
                </div>
              )}

              <div className="text-center mt-4 text-xs">
                <p>GRACIAS POR SU COMPRA</p>
                <p className="text-[10px] mt-4">Generado por www.duxsoftware.com.ar</p>
              </div>
            </div>
          )}

          {ticketAImprimir.tipo_crudo === 'factura' && (
            <div className="pt-2">
              <div className="text-xs uppercase mb-2 leading-tight">
                <p>SAGUIR DIEGO EDUARDO</p>
                <p>CUIT: 20349738172</p>
                <p>CARLOS JANIK 761</p>
                <p>ING. BRUTOS 20-34973817-2</p>
                <p>INICIO ACTIVIDAD 08/2010</p>
                <p>RESPONSABLE INSCRIPTO A CONSUMIDOR FINAL</p>
              </div>

              <p className="border-t border-black border-dashed mb-1"></p>
              
              <div className="text-xs uppercase mb-2 leading-tight">
                <p className="font-bold">FACTURA: {ticketAImprimir.numero_dux}</p>
                {ticketAImprimir.cae && (
                  <p>CAE: {ticketAImprimir.cae} FECHA VTO: {
                    (() => {
                      let vtoFormat = ticketAImprimir.vto;
                      if (vtoFormat && vtoFormat.includes('-')) {
                          const parts = vtoFormat.split('T')[0].split('-');
                          if (parts.length === 3) vtoFormat = `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
                      return vtoFormat || '';
                    })()
                  }</p>
                )}
                <p>CLIENTE: {ticketAImprimir.cliente.nombre}</p>
                <p>CATEGORIA FISCAL: {ticketAImprimir.cliente.categoria_iva}</p>
                <p>FECHA: {ticketAImprimir.fecha.split(',')[0].trim()} HORA: {ticketAImprimir.fecha.split(',')[1].trim().substring(0, 5)}</p>
              </div>

              <p className="border-t border-black border-dashed mb-1"></p>
              <div className="text-xs w-full mb-1">
                <p>Cant. x Precio Unit.</p>
                <div className="flex justify-between">
                  <p>Descripcion</p>
                  <p>Total</p>
                </div>
              </div>
              <p className="border-b border-black border-dashed mb-1"></p>

              <div className="text-xs mb-2">
                {ticketAImprimir.items.map((item, i) => {
                   let precioMuestra = parseFloat(item.precio_cobrado);
                   let subtotalItem = parseFloat(item.cantidad) * precioMuestra;
                   return (
                    <div key={i} className="mb-1">
                      <p>{parseFloat(item.cantidad).toFixed(2).replace('.', ',')} x {precioMuestra.toFixed(2).replace('.', ',')}</p>
                      <div className="flex justify-between">
                        <p className="truncate max-w-[200px]">{item.nombre.toUpperCase()}</p>
                        <p>$ {subtotalItem.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="border-t border-black border-dashed mb-1"></p>
              <div className="text-xs uppercase space-y-1">
                
                <div className="flex justify-between"><p>REG. FISCAL (LEY 27.743)</p><p></p></div>
                <div className="flex justify-between"><p>IVA CONTENIDO:</p><p>$ {((ticketAImprimir.subtotal * 0.21)).toFixed(2).replace('.', ',')}</p></div>
                <div className="flex justify-between"><p>OTROS IMP. NAC. INDIRECTOS:</p><p>$ 0,00</p></div>
                <p className="border-t border-black border-dashed mt-1 mb-1"></p>

                <div className="flex justify-between"><p>SUBTOTAL:</p><p>$ {ticketAImprimir.subtotal.toFixed(2).replace('.', ',')}</p></div>
                <div className="flex justify-between"><p>DESCUENTO:</p><p>$ {((ticketAImprimir.subtotal * (ticketAImprimir.descuento / 100)) || 0).toFixed(2).replace('.', ',')}</p></div>
                <div className="flex justify-between font-bold text-sm mt-1"><p>TOTAL:</p><p>$ {ticketAImprimir.total.toFixed(2).replace('.', ',')}</p></div>
              </div>

              {ticketAImprimir.observaciones && ticketAImprimir.observaciones.trim() !== '' && (
                <div className="text-xs mt-3 border-t border-black border-dashed pt-1">
                  <p className="font-bold">OBSERVACIONES:</p>
                  <p className="whitespace-pre-wrap">{ticketAImprimir.observaciones.toUpperCase()}</p>
                </div>
              )}

              <div className="text-center mt-6 text-xs font-bold">
                <p>GRACIAS POR SU COMPRA</p>
                <p className="text-[10px] mt-2 font-normal">Generado por www.duxsoftware.com.ar</p>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}

export default App;