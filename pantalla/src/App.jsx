import { useState, useEffect } from 'react';

// ==========================================
// FUNCIÓN PARA CALCULAR ALERTAS DE 24HS (DARK)
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
    return <span className="ml-2 text-[10px] font-black bg-green-900 text-green-300 px-2 py-0.5 rounded border border-green-700 shadow-sm" title="Agregado recientemente al sistema">NUEVO 🆕</span>;
  } else if (precioActual > precioAnt) {
    return <span className="ml-2 text-[10px] font-black bg-red-900 text-red-300 px-2 py-0.5 rounded border border-red-700 shadow-sm" title={`Precio anterior: $${precioAnt.toFixed(2)}`}>SUBIÓ 📈</span>;
  } else if (precioActual < precioAnt) {
    return <span className="ml-2 text-[10px] font-black bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded border border-yellow-700 shadow-sm" title={`Precio anterior: $${precioAnt.toFixed(2)}`}>BAJÓ 📉</span>;
  } else {
    return <span className="ml-2 text-[10px] font-black bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-700 shadow-sm" title="Se modificó la descripción del artículo">MODIFICADO ✏️</span>;
  }
};

// ==========================================
// TABLA DE INTERESES POR CUOTA
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
// MODAL PARA GESTIONAR O SUBIR FOTO A UN PRODUCTO
// ==========================================
const ModalSubirFoto = ({ producto, onClose, onExito }) => {
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [borrando, setBorrando] = useState(false);
  
  // Si el producto ya tiene imagen, entramos en modo "Gestión" para no pisarla por accidente
  const [modoGestion, setModoGestion] = useState(producto.tiene_imagen);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          setArchivo(file);
          setPreview(URL.createObjectURL(file));
          setModoGestion(false); // Salimos del modo gestión para permitir guardar la nueva
          break; 
        }
      }
    };

    // NUEVO: Cerrar modal con la tecla ESCAPE
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const manejarSeleccion = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setPreview(URL.createObjectURL(file));
      setModoGestion(false); // Salimos del modo gestión para permitir guardar la nueva
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

  const borrarDelServidor = async () => {
    if (!window.confirm("¿Estás seguro de que querés ELIMINAR la foto actual? Esto afectará también a la web.")) return;
    setBorrando(true);
    try {
      const res = await fetch('http://192.168.88.250:5000/api/borrar_imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: producto.codigo })
      });
      if (res.ok) {
        alert("🗑️ Foto eliminada físicamente del servidor.");
        onExito(); // Forzamos que se vuelva a buscar para que se actualice la lista (y desaparezca el tilde)
        onClose();
      } else {
        alert("❌ Error al intentar borrar la foto en Python.");
      }
    } catch (e) {
      alert("Fallo la conexión con Python.");
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[200] p-4">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md text-center border border-gray-700">
        <h2 className="text-xl font-black mb-2 text-blue-400 border-b border-gray-700 pb-2">📸 Gestión de Foto</h2>
        <p className="text-sm font-bold text-gray-300 mb-4">{producto.nombre}</p>
        
        {modoGestion ? (
          <div className="mb-4">
            <img 
              src={`http://192.168.88.250:5000/imagenes/${producto.codigo.trim()}.webp?_t=${new Date().getTime()}`} 
              alt="Foto actual en el servidor" 
              className="w-48 h-48 object-cover rounded-lg border-2 border-blue-500 mx-auto bg-white mb-4 shadow-lg" 
            />
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setModoGestion(false)} 
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow transition-colors"
              >
                🔄 Reemplazar Foto
              </button>
              <button 
                onClick={borrarDelServidor} 
                disabled={borrando} 
                className="bg-gray-700 hover:bg-red-800 text-red-400 hover:text-white border border-gray-600 font-bold py-2 px-4 rounded shadow transition-colors disabled:bg-gray-800"
              >
                {borrando ? 'Borrando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        ) : preview ? (
          <div className="mb-4">
            <img src={preview} alt="Vista previa" className="w-48 h-48 object-cover rounded-lg border-2 border-dashed border-green-500 mx-auto bg-gray-900" />
            <button onClick={() => { setArchivo(null); setPreview(null); if (producto.tiene_imagen) setModoGestion(true); }} className="text-red-400 text-xs font-bold mt-2 hover:underline">
              {producto.tiene_imagen ? 'Cancelar reemplazo' : 'Quitar foto'}
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <label className="cursor-pointer bg-gray-900 hover:bg-gray-700 border-2 border-dashed border-gray-600 text-gray-400 font-bold py-10 px-4 rounded-lg block transition-colors">
              <span className="block mb-2 text-2xl">📋</span>
              PEGÁ (Ctrl+V) la nueva imagen<br/>
              <span className="text-xs text-gray-500 mt-2 block">o hacé clic para buscar en la PC...</span>
              <input type="file" className="hidden" accept="image/*" onChange={manejarSeleccion} />
            </label>
            {producto.tiene_imagen && (
              <button onClick={() => setModoGestion(true)} className="text-blue-400 text-xs font-bold mt-2 hover:underline">
                Volver a ver la foto actual
              </button>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-700">
          <button onClick={onClose} disabled={subiendo || borrando} className="px-4 py-2 bg-gray-700 text-gray-200 font-bold rounded hover:bg-gray-600 w-full transition-colors">Cancelar (ESC)</button>
          {!modoGestion && (
            <button onClick={subirAlServidor} disabled={subiendo || !archivo} className="px-4 py-2 bg-green-600 text-white font-black rounded shadow hover:bg-green-500 disabled:bg-green-800 disabled:text-gray-400 w-full transition-colors">
              {subiendo ? 'Enviando al Servidor...' : '💾 Guardar Nueva Foto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MODAL DE DICCIONARIO
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
    } catch (e) {
      console.error(e);
    }
  };

  const guardarSinonimo = async (e) => {
    e.preventDefault();
    let oficialFinal = modo === 'familia' ? terminoOficial.trim().toUpperCase() : (productoSeleccionado ? productoSeleccionado.nombre : '');
    if (!oficialFinal || !terminoCallejero.trim()) return alert("⚠️ Completá todos los campos.");
    setGuardando(true);
    try {
      const res = await fetch('http://192.168.88.250:5000/api/diccionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callejera: terminoCallejero.toLowerCase(), oficial: oficialFinal })
      });
      if (res.ok) {
        alert(modo === 'familia' ? "✅ Familia aprendida." : "✅ Producto exacto aprendido.");
        onClose();
      } else {
        alert("❌ Error al guardar.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700">
        <h2 className="text-2xl font-black mb-4 text-blue-400 border-b border-gray-700 pb-2">📖 Enseñar al Sistema</h2>
        
        <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-lg border border-gray-700">
          <button type="button" onClick={() => { setModo('familia'); setTerminoCallejero(''); }} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${modo === 'familia' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`}>📂 Familia (Masivo)</button>
          <button type="button" onClick={() => { setModo('exacto'); setTerminoCallejero(''); }} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${modo === 'exacto' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`}>🎯 Producto Único</button>
        </div>

        <form onSubmit={guardarSinonimo} className="flex flex-col gap-4">
          {modo === 'familia' ? (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <label className="text-xs font-bold text-blue-400 block mb-1">Palabra Oficial (Ej: ENTRE ROSCA)</label>
              <input type="text" value={terminoOficial} onChange={(e) => setTerminoOficial(e.target.value.toUpperCase())} className="w-full p-2 border border-gray-600 rounded-lg font-bold outline-none focus:border-blue-500 bg-gray-800 text-white placeholder-gray-500" placeholder="Ej: ENTRE ROSCA" autoFocus />
            </div>
          ) : (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 relative">
              <label className="text-xs font-bold text-green-400 block mb-1">Buscá el Producto Exacto</label>
              {productoSeleccionado ? (
                <div className="p-2 bg-gray-800 border border-green-500 rounded-lg flex justify-between items-center shadow-sm">
                  <span className="font-bold text-green-400 text-xs">{productoSeleccionado.nombre}</span>
                  <button type="button" onClick={() => setProductoSeleccionado(null)} className="text-red-400 font-black hover:text-red-300 px-2">X</button>
                </div>
              ) : (
                <>
                  <input type="text" value={busquedaExacta} onChange={(e) => buscarExacto(e.target.value)} className="w-full p-2 border border-gray-600 rounded-lg font-bold outline-none focus:border-green-500 bg-gray-800 text-white placeholder-gray-500" placeholder="Escribí para buscar..." autoFocus />
                  {resultadosExactos.length > 0 && (
                    <ul className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 shadow-2xl rounded-b-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {resultadosExactos.map((prod, idx) => (
                        <li key={idx} onClick={() => { setProductoSeleccionado(prod); setResultadosExactos([]); setBusquedaExacta(''); }} className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer font-bold text-xs text-gray-200 flex justify-between">
                          <span>{prod.nombre}</span>
                          <span className="text-green-400">${prod.precio}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mt-2">
            <label className="text-xs font-bold text-orange-400 block mb-1">¿Cómo lo pide el cliente en el mostrador?</label>
            <input type="text" value={terminoCallejero} onChange={(e) => setTerminoCallejero(e.target.value.toLowerCase())} className="w-full p-3 border border-gray-600 rounded-lg font-bold outline-none focus:border-orange-500 bg-gray-800 text-orange-300 placeholder-gray-500" placeholder="Ej: rosca con tuerca" />
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} disabled={guardando} className="px-4 py-2 bg-gray-700 text-gray-300 font-bold rounded hover:bg-gray-600 transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando || (!terminoOficial && !productoSeleccionado) || !terminoCallejero} className="px-6 py-2 bg-blue-600 text-white font-black rounded shadow hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors">
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const verificarCuitDux = async (cuit) => {
    if (cuit.length >= 10 && !idDestino) {
      try {
        const res = await fetch(`http://192.168.88.250:5000/api/clientes?q=${cuit}`);
        const data = await res.json();
        const existe = data.resultados?.find(c => c.cuit.replace(/\D/g, '') === cuit);
        if (existe) {
          if (window.confirm(`⚠ El CUIT ${cuit} ya está cargado:\n👤 ${existe.nombre}\n\n¿Cargar datos para editar?`)) {
            setIdDestino(existe.id);
            setFormData(prev => ({ ...prev, apellido_razon_social: existe.nombre, categoria_fiscal: existe.categoria_iva }));
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
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar)
      });
      const data = await response.json();
      if (response.ok) {
        alert(idDestino ? '✅ Cliente actualizado' : '✅ Cliente creado en DUX');
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
        <h2 className="text-xl font-black mb-4 text-gray-100 border-b border-gray-700 pb-2">
          {idDestino ? '✏ Editar Cliente' : '👤 Nuevo Cliente'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">CUIT / DNI</label>
            <input type="text" name="cuit_cuil" value={formData.cuit_cuil} onChange={(e) => setFormData({...formData, cuit_cuil: e.target.value.replace(/\D/g, '')})} onBlur={(e) => verificarCuitDux(e.target.value.replace(/\D/g, ''))} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500 placeholder-gray-600" placeholder="Ej: 20366062999" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Razón Social *</label>
              <input type="text" name="apellido_razon_social" value={formData.apellido_razon_social} onChange={handleChange} required className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Nombre</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Provincia</label>
              <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Localidad</label>
              <input type="text" name="localidad" value={formData.localidad} onChange={handleChange} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">Domicilio</label>
            <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">Condición IVA</label>
            <select name="categoria_fiscal" value={formData.categoria_fiscal} onChange={handleChange} className="w-full p-2 border border-gray-600 rounded font-bold outline-none bg-gray-900 text-white focus:border-blue-500">
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} disabled={cargando} className="px-4 py-2 bg-gray-700 text-gray-300 font-bold rounded hover:bg-gray-600 transition-colors">Cancelar</button>
            <button type="submit" disabled={cargando} className="px-4 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-500 transition-colors">
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
  const [progresoSync, setProgresoSync] = useState(0);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(localStorage.getItem('ultimaActualizacion') || 'Nunca');

  const clientePorDefecto = { nombre: "Consumidor Final", cuit: "00000000", categoria_iva: "Consumidor Final", id: 14020175 };
  const [clienteActual, setClienteActual] = useState(clientePorDefecto);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [mostrarBuscadorCliente, setMostrarBuscadorCliente] = useState(false);

  const [vendedor, setVendedor] = useState(null);
  const [condicionPago, setCondicionPago] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(1);
  
  // NUEVO ESTADO PARA EL PAGO MIXTO (Efectivo físico entregado por el cliente)
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState('');

  const listaVendedores = [
    { id: 6257259, nombre: "PABLO" },
    { id: 15543779, nombre: "MAURICIO" },
    { id: 6257260, nombre: "VALENTÍN" }
  ];

  // ==========================================
  // EFECTOS: FACTURAS PENDIENTES Y SEMÁFORO
  // ==========================================
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
              const res = await fetch(`http://192.168.88.250:5000/api/rastrear_numero?id=${p.idCliente}&tipo=${p.ticketData.tipo_crudo}&total=${p.ticketData.total}&_t=${new Date().getTime()}`);
              if (res.ok) {
                 const data = await res.json();
                 if (data.numero && data.cae && data.numero !== "S/N") {
                    actualizados = true;
                    return { ...p, estado: 'listo', ticketData: { ...p.ticketData, numero_dux: data.numero, cae: data.cae, vto: data.vto } };
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

  useEffect(() => {
    const revisarSemaforo = async () => {
      try {
        const res = await fetch(`http://192.168.88.250:5000/api/estado_sync?_t=${new Date().getTime()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sincronizando && !sincronizando) {
            setSincronizando(true); 
          } else if (!data.sincronizando && sincronizando) {
            setSincronizando(false);
            setProgresoSync(0);
            const fechaStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
            setUltimaActualizacion(fechaStr);
            localStorage.setItem('ultimaActualizacion', fechaStr);
          }
        }
      } catch (e) {
      }
    };
    const intervalo_semaforo = setInterval(revisarSemaforo, 10000);
    revisarSemaforo(); 
    return () => clearInterval(intervalo_semaforo);
  }, [sincronizando]);

  // ==========================================
  // FUNCIONES DE INTERFAZ Y CÁLCULOS
  // ==========================================
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
    if (!window.confirm("¿Descargar precios actualizados desde DUX?")) return;
    setSincronizando(true);
    setProgresoSync(0);

    try {
      const res = await fetch('http://192.168.88.250:5000/api/sincronizar', { method: 'POST' });
      if (res.ok) {
        let progresoSimulado = 0;
        const intervalo_barra = setInterval(() => {
          progresoSimulado += 5;
          if (progresoSimulado >= 95) {
            clearInterval(intervalo_barra);
            setProgresoSync(95);
          } else {
            setProgresoSync(progresoSimulado);
          }
        }, 1000); 
      } else {
        alert("❌ Error: Ya hay una sincronización en progreso desde otra caja.");
        setSincronizando(false);
      }
    } catch (e) { 
      alert("Error de conexión."); 
      setSincronizando(false);
    }
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
    } catch (error) {
      console.error("Error backend:", error);
    }
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
    if (evento.key === 'Escape') {
      setBusqueda('');
      setResultados([]);
      setSugerencia(null);
      setTraduccionActiva(null);
    }
  };

  const manejarTecladoCliente = (evento) => {
    if (evento.key === 'Escape') {
      setBusquedaCliente('');
      setResultadosCliente([]);
      setMostrarBuscadorCliente(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.codigo === producto.codigo);
    if (existe) {
      setCarrito(carrito.map(item => item.codigo === producto.codigo ? { ...item, cantidad: parseFloat(item.cantidad) + 1 } : item ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, precio_original: parseFloat(producto.precio), precio_cobrado: parseFloat(producto.precio).toFixed(2), descuento: 0, iva: parseFloat(producto.iva) || 21 }]);
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

  const eliminarItem = (codigo) => setCarrito(carrito.filter(item => item.codigo !== codigo));
  const calcularSubtotalItem = (item) => (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_cobrado) || 0);

  // ==========================================
  // MAGIA MATEMÁTICA DEL PAGO MIXTO
  // ==========================================
  const subtotalCarrito = carrito.reduce((sum, item) => sum + calcularSubtotalItem(item), 0);
  const totalConDescuento = subtotalCarrito * (1 - ((parseFloat(descuentoTotal) || 0) / 100));
  
  let montoRecargoTarjeta = 0;
  let totalFinalCalculado = totalConDescuento;
  let baseParaTarjeta = 0;
  let efectivoParaMixto = parseFloat(montoEfectivoMixto) || 0;

  const interesPorcentaje = tablaCuotas.find(c => c.cuotas === cuotasSeleccionadas)?.interes || 0;

  // Calculamos a qué parte de la cuenta aplicarle el interés
  if (condicionPago === 'CONTADO') {
    if (metodoPago === 'TARJETA') {
      baseParaTarjeta = totalConDescuento;
      montoRecargoTarjeta = baseParaTarjeta * (interesPorcentaje / 100);
      totalFinalCalculado = totalConDescuento + montoRecargoTarjeta;
    } else if (metodoPago === 'MIXTO') {
      // Si dio más plata en efectivo de lo que vale la venta, la base para la tarjeta es 0.
      baseParaTarjeta = totalConDescuento > efectivoParaMixto ? totalConDescuento - efectivoParaMixto : 0;
      montoRecargoTarjeta = baseParaTarjeta * (interesPorcentaje / 100);
      totalFinalCalculado = totalConDescuento + montoRecargoTarjeta;
    }
  }

  const valorCuota = cuotasSeleccionadas > 0 ? ((baseParaTarjeta + montoRecargoTarjeta) / cuotasSeleccionadas) : (baseParaTarjeta + montoRecargoTarjeta);

  const ejecutarBusquedaCliente = async (texto) => {
    try {
      const respuesta = await fetch(`http://192.168.88.250:5000/api/clientes?q=${texto}`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setResultadosCliente(datos.resultados || []);
      }
    } catch (error) {
      console.error("Error cliente:", error);
    }
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

  // ==========================================
  // ENVÍO A DUX Y CIERRE (ADAPTADO PARA MIXTO)
  // ==========================================
  const finalizarVenta = async (tipo_comprobante) => {
    if (carrito.length === 0) return;
    if (!vendedor) return alert("⚠️ Seleccioná el VENDEDOR.");
    if (tipo_comprobante === 'comprobante_venta' || tipo_comprobante === 'factura') {
      if (!condicionPago) return alert("⚠️ Seleccioná la CONDICIÓN DE PAGO.");
      if (condicionPago === 'CONTADO' && !metodoPago) return alert("⚠️ Indicá EFECTIVO, TARJETA o MIXTO.");
      if (metodoPago === 'MIXTO' && (!montoEfectivoMixto || parseFloat(montoEfectivoMixto) <= 0)) return alert("⚠️ En Pago Mixto, tenés que indicar el monto en efectivo entregado.");
    }

    let carritoProcesado = carrito;
    let subtotalProcesado = subtotalCarrito;

    // Repartimos de manera invisible el cargo de la tarjeta entre los artículos para que a DUX le cierren los números perfectos.
    if (montoRecargoTarjeta > 0 && totalConDescuento > 0) {
      const factorRecargo = totalFinalCalculado / totalConDescuento;
      carritoProcesado = carrito.map(item => ({ 
        ...item, 
        precio_cobrado: (parseFloat(item.precio_cobrado) * factorRecargo).toFixed(2) 
      }));
      subtotalProcesado = carritoProcesado.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_cobrado)), 0);
    }

    const totalFinalDux = subtotalProcesado * (1 - ((parseFloat(descuentoTotal) || 0) / 100));

    // Calculamos qué le decimos a DUX que entró por cada caja
    const monto_final_efectivo = metodoPago === 'MIXTO' ? efectivoParaMixto : (metodoPago === 'EFECTIVO' ? totalFinalDux : 0);
    const monto_final_tarjeta = metodoPago === 'MIXTO' ? (baseParaTarjeta + montoRecargoTarjeta) : (metodoPago === 'TARJETA' ? totalFinalDux : 0);

    const paquete_dux = {
      tipo: tipo_comprobante,
      cliente: clienteActual,
      items: carritoProcesado,
      descuento_total: descuentoTotal,
      id_personal: vendedor,
      condicion_pago: condicionPago,
      metodo_pago: metodoPago,       
      total_final: totalFinalDux.toFixed(2),
      observaciones: observaciones,
      // Nuevas variables separadas para DUX
      monto_efectivo: monto_final_efectivo,
      monto_tarjeta: monto_final_tarjeta,
      cuotas_tarjeta: cuotasSeleccionadas
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
                  metodo_pago: metodoPago,
                  monto_efectivo: monto_final_efectivo,
                  monto_tarjeta: monto_final_tarjeta,
                  numero_dux: 'S/N',
                  cae: null,
                  vto: null,
                  observaciones: observaciones 
               }
            };
            const nuevaLista = [...pendientes, nuevoPendiente];
            setPendientes(nuevaLista);
            localStorage.setItem('facturasPendientes', JSON.stringify(nuevaLista));
            
            // Limpieza
            setCarrito([]); setDescuentoTotal(0); setBusqueda(''); setResultados([]); setCondicionPago(null); setMetodoPago(null); setCuotasSeleccionadas(1); setObservaciones(''); setClienteActual(clientePorDefecto); setMontoEfectivoMixto(''); setPantallaCarga({ activo: false, mensaje: '' });
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
              metodo_pago: metodoPago,
              monto_efectivo: monto_final_efectivo,
              monto_tarjeta: monto_final_tarjeta,
              numero_dux: numeroTicket,
              observaciones: observaciones 
            });

            // Limpieza
            setCarrito([]); setDescuentoTotal(0); setBusqueda(''); setResultados([]); setCondicionPago(null); setMetodoPago(null); setCuotasSeleccionadas(1); setObservaciones(''); setClienteActual(clientePorDefecto); setMontoEfectivoMixto(''); setPantallaCarga({ activo: false, mensaje: '' });
            setTimeout(() => { window.print(); }, 800);
        }
      } else {
        alert("❌ Error: " + datos_respuesta.error);
        setPantallaCarga({ activo: false, mensaje: '' });
      }
    } catch (error) {
      alert("Error de red.");
      setPantallaCarga({ activo: false, mensaje: '' });
    } 
  };

  return (
    <div style={{ fontFamily: "'Roboto', sans-serif" }} className="min-h-screen bg-gray-950 text-gray-100 flex flex-col p-2 md:p-4 lg:flex-row gap-4 print:bg-white print:text-black">
      
      {pantallaCarga.activo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-center items-center z-[200] text-white">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500 mb-6"></div>
          <h2 className="text-3xl font-black mb-2 animate-pulse text-blue-400">Procesando Venta...</h2>
          <p className="text-xl text-gray-300 font-bold mb-1">{pantallaCarga.mensaje}</p>
        </div>
      )}

      {mostrarPanelPendientes && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[150] print:hidden p-4">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto border border-gray-700">
              <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                  <h2 className="text-2xl font-black text-gray-100">Facturas Pendientes</h2>
                  <button onClick={() => setMostrarPanelPendientes(false)} className="text-red-500 font-black text-xl hover:text-red-400">X</button>
              </div>
              {pendientes.length === 0 ? (
                  <p className="text-center text-gray-500 font-bold py-10">No hay facturas procesando.</p>
              ) : (
                  <div className="space-y-3">
                      {pendientes.map((p, index) => (
                          <div key={index} className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 ${p.estado === 'listo' ? 'border-green-600 bg-green-900/30' : 'border-orange-600 bg-orange-900/30'}`}>
                              <div className="text-center md:text-left">
                                  <p className="font-bold text-lg text-gray-100">{p.ticketData.cliente.nombre}</p>
                                  <p className="text-sm text-gray-400">Total: ${p.ticketData.total} | Tipo: {p.ticketData.tipo}</p>
                                  {p.estado === 'procesando' ? (
                                      <p className="text-orange-400 font-bold mt-1 text-xs animate-pulse">⏳ Esperando CAE desde AFIP...</p>
                                  ) : (
                                      <p className="text-green-400 font-bold mt-1 text-xs">✅ Nro: {p.ticketData.numero_dux} | CAE Listo</p>
                                  )}
                              </div>
                              <div className="flex gap-2">
                                  {p.estado === 'listo' && (
                                      <button onClick={() => imprimirPendiente(p)} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded shadow transition-colors">🖨 Imprimir</button>
                                  )}
                                  <button onClick={() => borrarPendiente(p.id)} className="bg-gray-700 hover:bg-red-900 text-red-400 font-bold px-3 py-2 rounded shadow-sm transition-colors border border-gray-600 hover:border-red-700">Borrar</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>
      )}

      {imagenHover && (
        <div className="fixed pointer-events-none z-[300] bg-gray-900 p-2 rounded-xl shadow-2xl border-4 border-blue-500" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px' }}>
          <img src={`http://192.168.88.250:5000/imagenes/${imagenHover}.webp`} alt="Producto" className="w-full h-full object-contain" />
        </div>
      )}

      {/* PANEL IZQUIERDO (Buscador y Carrito) */}
      <div className="flex-[7] bg-gray-800 rounded-xl shadow-2xl flex flex-col h-[65vh] lg:h-[95vh] border border-gray-700 relative print:hidden">
        
        <div className="bg-gray-900 p-4 text-white rounded-t-xl flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-700 relative overflow-hidden">
          
          {sincronizando && (
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-linear" 
                style={{ width: `${progresoSync}%` }}
              ></div>
            </div>
          )}
          
          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
             <h1 className="text-2xl font-black text-blue-400 whitespace-nowrap">GUN</h1>
             
             <button 
                onClick={ejecutarSincronizacionManual} 
                disabled={sincronizando} 
                className={`px-4 py-2 rounded transition-colors shadow-sm border whitespace-nowrap flex flex-col items-center justify-center ${sincronizando ? 'bg-orange-600 border-orange-500 text-white cursor-not-allowed' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200'}`}
             >
                <span className="text-sm font-bold">
                  {sincronizando ? `⏳ Sincronizando... ${progresoSync}%` : '🔄 Actualizar Precios'}
                </span>
                {!sincronizando && (
                  <span className="text-[10px] text-gray-400 font-normal mt-1 block">
                    Última act: {ultimaActualizacion}
                  </span>
                )}
             </button>

             <button onClick={() => setMostrarModalDiccionario(true)} className="px-4 py-2 text-sm font-bold rounded transition-colors shadow-sm bg-blue-900/50 border border-blue-800 hover:bg-blue-800 text-blue-300 whitespace-nowrap">
                📖 Enseñar Sinónimo
             </button>
          </div>
          <button onClick={() => setMostrarPanelPendientes(true)} className={`font-bold px-4 py-2 rounded shadow-md border transition-colors w-full sm:w-auto ${pendientes.some(p => p.estado === 'listo') ? 'bg-green-700 hover:bg-green-600 border-green-500 text-white animate-pulse' : pendientes.length > 0 ? 'bg-orange-700 hover:bg-orange-600 border-orange-500 text-white' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
             ⏳ Facturas Pendientes ({pendientes.length})
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700 relative z-20 bg-gray-800 shrink-0">
          <input type="text" placeholder="Escriba para buscar producto... (ESC para limpiar)" className="w-full p-4 text-xl md:text-2xl border-2 border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-900 text-white placeholder-gray-500 shadow-inner" value={busqueda} onChange={manejarEscritura} onKeyDown={manejarTeclado} autoFocus />
          
          {(resultados.length > 0 || sugerencia || busqueda.trim() !== '') && (
            <div className="absolute top-full left-0 w-full bg-gray-800 shadow-2xl z-50 max-h-[50vh] overflow-y-auto border border-gray-600 rounded-b-xl border-t-0">
              {traduccionActiva && (
                <div className="bg-blue-900/50 p-2 text-blue-300 text-center font-bold text-sm border-b border-blue-800">
                  💡 Entendimos: <span className="font-black text-blue-400">{traduccionActiva}</span>
                </div>
              )}
              {resultados.length === 0 ? (
                <div className="p-4 flex flex-col items-center justify-center">
                  {sugerencia ? (
                    <div className="text-center bg-gray-900 p-6 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-lg mb-2">No encontramos nada exacto.</p>
                      <p className="text-xl flex flex-col sm:flex-row items-center justify-center gap-2">
                        ¿Quisiste decir <button onClick={aplicarSugerencia} className="text-blue-400 font-black text-xl md:text-2xl hover:underline bg-gray-800 px-3 py-1 rounded shadow-sm border border-gray-600">{sugerencia}</button>? 
                      </p>
                    </div>
                  ) : ( <div className="text-gray-500 text-lg">Buscando... (ESC para salir)</div> )}
                </div>
              ) : (
                <ul className="space-y-0">
                  {resultados.map((prod, index) => (
                    <li key={index} className="p-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-700 flex flex-col sm:flex-row justify-between sm:items-center group gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => agregarAlCarrito(prod)}>
                        <div className="font-bold text-base md:text-lg text-gray-100 flex flex-wrap items-center gap-1">
                            {prod.nombre} {obtenerEtiquetaCambio(prod)}
                        </div>
                        <p className="text-xs md:text-sm text-gray-400 font-mono">Cód: {prod.codigo}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 border-gray-700 pt-2 sm:pt-0">
                        {/* BOTON DE LA CAMARITA: onClick para subir (si no tiene) y onDoubleClick para gestionar (si tiene) */}
                        <button 
                          className={`p-2 rounded-full transition-all ${prod.tiene_imagen ? 'text-blue-400 bg-blue-900/30 border border-blue-800 shadow-sm hover:scale-110' : 'text-gray-500 border border-transparent hover:text-blue-300 hover:bg-gray-600'}`}
                          title={prod.tiene_imagen ? 'Doble clic: Gestionar Foto (Reemplazar/Eliminar)' : 'Clic: Subir foto para este producto'}
                          onMouseEnter={() => { if(prod.tiene_imagen) setImagenHover(prod.codigo.trim()); }}
                          onMouseLeave={() => setImagenHover(null)}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(!prod.tiene_imagen) setProductoParaSubirFoto(prod); 
                          }}
                          onDoubleClick={(e) => { 
                            e.stopPropagation(); 
                            if(prod.tiene_imagen) setProductoParaSubirFoto(prod); 
                          }}
                        >📸</button>
                        <div className="text-xl md:text-2xl font-black text-green-400 cursor-pointer" onClick={() => agregarAlCarrito(prod)}>${parseFloat(prod.precio).toFixed(2)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* CARRITO CINTA PLANA (Sin abreviaturas) */}
        <div className="flex-1 overflow-y-auto p-2 bg-gray-950 z-10 rounded-b-xl shadow-inner">
          {carrito.length === 0 ? (
             <div className="text-center text-gray-600 text-xl font-bold mt-10">El carrito está vacío</div>
          ) : (
            <div className="space-y-2">
              {carrito.map((item, i) => {
                const precioCobrado = parseFloat(item.precio_cobrado) || 0;
                const precioOriginal = parseFloat(item.precio_original) || 0;
                const diferencia = precioCobrado - precioOriginal;

                return (
                  <div key={i} className="p-2 bg-gray-800 border-b border-gray-700 flex flex-col xl:flex-row xl:items-center justify-between gap-3 hover:bg-gray-750 transition-colors">
                    
                    {/* Sección Nombre y Botón X */}
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <button onClick={() => eliminarItem(item.codigo)} className="bg-gray-700 hover:bg-red-900 text-red-400 font-black w-8 h-8 rounded flex items-center justify-center border border-gray-600 transition-colors shrink-0">
                        X
                      </button>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-gray-100 text-sm truncate" title={item.nombre}>{item.nombre}</span>
                        <div className="flex gap-3">
                          {diferencia < -0.01 && <span className="text-[10px] text-orange-400 font-bold">Precio original: ${precioOriginal.toFixed(2)}</span>}
                          {diferencia > 0.01 && <span className="text-[10px] text-red-400 font-bold">Recargo manual: +${diferencia.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sección Inputs en fila compacta */}
                    <div className="flex items-center gap-2 xl:gap-4 shrink-0 bg-gray-900 p-1.5 rounded border border-gray-700">
                      
                      <div className="flex flex-col w-[70px]">
                        <span className="text-[9px] text-gray-400 font-bold text-center mb-0.5">Cantidad</span>
                        <input type="number" className="w-full p-1 border border-gray-600 rounded text-center font-black bg-gray-800 text-white focus:border-blue-500 outline-none text-sm" value={item.cantidad} onChange={(e) => modificarItem(item.codigo, 'cantidad', e.target.value)} onFocus={(e) => e.target.select()} min="1" />
                      </div>
                      
                      <div className="flex flex-col w-[100px]">
                        <span className="text-[9px] text-blue-400 font-bold text-center mb-0.5">Precio Unitario ($)</span>
                        <input type="number" step="0.01" className="w-full p-1 border border-blue-800 bg-gray-800 rounded font-black text-blue-300 focus:border-blue-400 outline-none text-right text-sm" value={item.precio_cobrado} onChange={(e) => modificarItem(item.codigo, 'precio_cobrado', e.target.value)} onFocus={(e) => e.target.select()} />
                      </div>
                      
                      <div className="flex flex-col w-[80px]">
                        <span className="text-[9px] text-orange-400 font-bold text-center mb-0.5">Descuento (%)</span>
                        <input type="number" step="0.01" className="w-full p-1 border border-orange-800 bg-gray-800 rounded font-black text-orange-300 text-center focus:border-orange-500 outline-none text-sm" value={item.descuento} onChange={(e) => modificarItem(item.codigo, 'descuento', e.target.value)} onFocus={(e) => e.target.select()} />
                      </div>
                      
                      <div className="flex flex-col items-end min-w-[90px] pl-2 border-l border-gray-700">
                        <span className="text-[9px] text-gray-400 font-bold mb-0.5">Subtotal</span>
                        <span className="font-black text-lg text-green-400 leading-none">${calcularSubtotalItem(item).toFixed(2)}</span>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO (Checkout) */}
      <div className="flex-[3] bg-gray-800 rounded-xl shadow-2xl flex flex-col h-auto lg:h-[95vh] p-4 overflow-y-auto border border-gray-700 print:hidden">
        
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-4 shrink-0 relative z-30 shadow-inner">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-bold text-gray-400 tracking-wider">CLIENTE</span>
             <div className="flex gap-1">
               <button onClick={() => { setClienteAEditar(null); setMostrarModalABM(true); }} className="bg-gray-800 text-green-400 hover:bg-gray-700 font-black px-2 py-1 rounded shadow-sm border border-green-800 transition-colors">+</button>
               <button onClick={() => { setMostrarBuscadorCliente(!mostrarBuscadorCliente); if (!mostrarBuscadorCliente) setTimeout(() => document.getElementById('input-cliente').focus(), 100); }} className="text-blue-300 hover:text-blue-100 font-bold text-sm bg-gray-800 px-2 py-1 rounded shadow-sm border border-blue-800 transition-colors">
                 {mostrarBuscadorCliente ? '❌ Cerrar' : '🔍 Buscar'}
               </button>
             </div>
           </div>

           {mostrarBuscadorCliente ? (
             <div className="mt-2 relative">
               <input id="input-cliente" type="text" placeholder="DNI, CUIT o Nombre... (ESC para salir)" className="w-full p-2 border border-blue-600 rounded-lg focus:outline-none focus:border-blue-400 font-bold bg-gray-800 text-white placeholder-gray-500" value={busquedaCliente} onChange={manejarEscrituraCliente} onKeyDown={manejarTecladoCliente} />
               {resultadosCliente.length > 0 && (
                 <ul className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 shadow-2xl rounded-b-lg mt-1 max-h-48 overflow-y-auto z-50">
                   {resultadosCliente.map((cli, idx) => (
                     <li key={idx} onClick={() => seleccionarCliente(cli)} className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex justify-between items-center transition-colors">
                       <div>
                         <div className="font-bold text-gray-200 text-sm">{cli.nombre}</div>
                         <div className="text-xs text-gray-400 mt-1">CUIT: {cli.cuit} | {cli.categoria_iva}</div>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); setClienteAEditar(cli); setMostrarModalABM(true); }} className="text-gray-500 hover:text-orange-400 p-2 text-lg">✏️</button>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           ) : (
             <>
               <div className="flex justify-between items-start gap-2">
                 <div className="text-lg md:text-xl font-black text-gray-100 leading-tight" title={clienteActual.nombre}>{clienteActual.nombre}</div>
                 {clienteActual.cuit !== '00000000' && (
                   <button onClick={() => setClienteActual(clientePorDefecto)} className="text-red-400 hover:text-red-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded shadow-sm border border-red-800 font-bold text-xs whitespace-nowrap transition-colors">✖ Quitar</button>
                 )}
               </div>
               <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-2 gap-1">
                 <span className="text-sm text-gray-400 font-mono">CUIT: {clienteActual.cuit}</span>
                 <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700 self-start sm:self-auto">{clienteActual.categoria_iva}</span>
               </div>
             </>
           )}
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-700 pb-4 mb-4 shrink-0">
          <span className="font-bold text-gray-400 uppercase tracking-wide text-xs">Vendedor Asignado:</span>
          <div className="grid grid-cols-3 gap-2">
            {listaVendedores.map(v => (
              <button key={v.id} onClick={() => setVendedor(v.id)} className={`px-1 py-3 rounded-lg font-black text-[11px] md:text-xs transition-colors shadow-sm border ${vendedor === v.id ? 'bg-blue-600 text-white border-blue-400 shadow-blue-900/50' : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
                {v.nombre}
              </button>
            ))}
          </div>
        </div>
        
        {/* TOTALES */}
        <div className="space-y-3 mb-4 shrink-0">
          <div className="flex justify-between items-center text-gray-400 font-bold px-2">
            <span>Subtotal Bruto:</span>
            <span>${subtotalCarrito.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center bg-gray-900 p-2 rounded-lg border border-gray-700 shadow-inner">
            <span className="font-bold text-gray-300 text-sm pl-1">Descuento General (%)</span>
            <input type="number" step="0.01" className="w-20 p-1.5 border border-gray-600 bg-gray-800 rounded text-right font-black text-orange-400 focus:border-orange-500 outline-none" value={descuentoTotal} onChange={(e) => setDescuentoTotal(e.target.value)} onFocus={(e) => e.target.select()} />
          </div>

          <div className="flex flex-col bg-blue-900/20 p-4 rounded-xl border border-blue-800 shadow-lg">
            <span className="text-sm font-bold text-blue-400 tracking-wider">TOTAL A PAGAR</span>
            <span className="text-3xl md:text-4xl font-black text-white text-right my-1">${totalFinalCalculado.toFixed(2)}</span>
            {montoRecargoTarjeta > 0 && (
              <span className="text-xs font-bold text-purple-400 text-right mt-1">
                (Incluye +${montoRecargoTarjeta.toFixed(2)} recargo de Tarjeta)
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700 flex flex-col gap-3 shrink-0">
          
          <div className="flex flex-col bg-yellow-900/10 p-2 rounded-lg border border-yellow-800/50">
            <span className="font-bold text-yellow-500 uppercase text-[10px] mb-1 tracking-wide">📝 Observaciones del Pedido</span>
            <textarea 
              className="w-full p-2 border border-gray-600 rounded text-sm bg-gray-900 text-gray-200 focus:outline-none focus:border-yellow-600 placeholder-gray-600" 
              rows="1" placeholder="Ej: Entregar a las 17hs..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
            ></textarea>
          </div>

          <div className="flex flex-col gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Condición:</span>
            <div className="flex gap-2">
              <button onClick={() => { setCondicionPago('CONTADO'); setMetodoPago(null); setCuotasSeleccionadas(1); setMontoEfectivoMixto(''); }} className={`flex-1 py-2 rounded font-black shadow-sm text-xs border transition-colors ${condicionPago === 'CONTADO' ? 'bg-green-700 text-white border-green-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>CONTADO</button>
              <button onClick={() => { setCondicionPago('CUENTA_CORRIENTE'); setMetodoPago(null); setCuotasSeleccionadas(1); setMontoEfectivoMixto(''); }} className={`flex-1 py-2 rounded font-black shadow-sm text-xs border transition-colors ${condicionPago === 'CUENTA_CORRIENTE' ? 'bg-orange-700 text-white border-orange-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>CTA. CORRIENTE</button>
            </div>
          </div>

          {condicionPago === 'CONTADO' && (
            <div className="flex flex-col gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
              <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Método:</span>
              <div className="flex gap-2">
                <button onClick={() => { setMetodoPago('EFECTIVO'); setCuotasSeleccionadas(1); setMontoEfectivoMixto(''); }} className={`flex-1 py-2 rounded font-black shadow-sm text-xs border transition-colors ${metodoPago === 'EFECTIVO' ? 'bg-blue-700 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>EFECTIVO</button>
                <button onClick={() => { setMetodoPago('TARJETA'); setCuotasSeleccionadas(1); setMontoEfectivoMixto(''); }} className={`flex-1 py-2 rounded font-black shadow-sm text-xs border transition-colors ${metodoPago === 'TARJETA' ? 'bg-purple-700 text-white border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>TARJETA</button>
                <button onClick={() => { setMetodoPago('MIXTO'); setCuotasSeleccionadas(1); setMontoEfectivoMixto(''); }} className={`flex-1 py-2 rounded font-black shadow-sm text-xs border transition-colors ${metodoPago === 'MIXTO' ? 'bg-indigo-700 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}`}>MIXTO</button>
              </div>
            </div>
          )}

          {/* CAJA EXTRA PARA PAGO MIXTO */}
          {condicionPago === 'CONTADO' && metodoPago === 'MIXTO' && (
            <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-800 shadow-inner flex flex-col gap-2">
              <label className="text-xs font-bold text-indigo-300">Dinero entregado en Efectivo ($):</label>
              <input 
                type="number" 
                className="w-full p-2 border border-indigo-600 rounded font-black text-indigo-100 bg-gray-900 focus:outline-none focus:border-indigo-400"
                value={montoEfectivoMixto} 
                onChange={(e) => setMontoEfectivoMixto(e.target.value)}
                placeholder="Ej: 15000"
              />
              {parseFloat(montoEfectivoMixto) > 0 && (
                <div className="text-sm font-bold text-indigo-200 mt-1">
                  Monto a pasar por Tarjeta: ${(totalConDescuento - parseFloat(montoEfectivoMixto) > 0 ? totalConDescuento - parseFloat(montoEfectivoMixto) : 0).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {condicionPago === 'CONTADO' && (metodoPago === 'TARJETA' || (metodoPago === 'MIXTO' && baseParaTarjeta > 0)) && (
            <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-800 shadow-inner">
              <span className="font-bold text-purple-400 text-xs uppercase block mb-1">Seleccione Cuotas (Aplica solo al saldo de tarjeta):</span>
              <select 
                className="w-full p-2 border border-purple-600 rounded font-black text-purple-200 bg-gray-900 focus:outline-none focus:border-purple-400"
                value={cuotasSeleccionadas} onChange={(e) => setCuotasSeleccionadas(parseInt(e.target.value))}
              >
                {tablaCuotas.map(c => (
                  <option key={c.cuotas} value={c.cuotas}>
                    {c.cuotas} {c.cuotas === 1 ? 'Pago' : 'Cuotas'} {c.interes > 0 ? `(+${c.interes}%)` : '(Sin interés)'}
                  </option>
                ))}
              </select>

              {cuotasSeleccionadas > 1 && (
                <div className="mt-3 text-center bg-gray-900 p-2 rounded border border-purple-800">
                  <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Por la parte de tarjeta abonará</span>
                  <span className="block text-xl font-black text-purple-300">
                    {cuotasSeleccionadas} cuotas de ${valorCuota.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* BOTONES DE FACTURACIÓN CON COLORES Y NOMBRES COMPLETOS */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => finalizarVenta('presupuesto')} disabled={pantallaCarga.activo || carrito.length === 0} className={`p-4 rounded-lg font-black text-xs uppercase tracking-wide text-white shadow-md transition-all ${carrito.length > 0 ? 'bg-gray-700 hover:bg-gray-600 border border-gray-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'}`}>
              PRESUPUESTO
            </button>
            <button onClick={() => finalizarVenta('comprobante_venta')} disabled={pantallaCarga.activo || carrito.length === 0} className={`p-4 rounded-lg font-black text-xs uppercase tracking-wide text-white shadow-md transition-all ${carrito.length > 0 ? 'bg-blue-700 hover:bg-blue-600 border border-blue-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'}`}>
              COMPROBANTE VENTA
            </button>
            <button onClick={() => finalizarVenta('factura')} disabled={pantallaCarga.activo || carrito.length === 0} className={`col-span-2 p-4 rounded-lg font-black text-sm uppercase tracking-widest text-white shadow-lg transition-all ${carrito.length > 0 ? 'bg-green-700 hover:bg-green-600 border border-green-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'}`}>
              {String(clienteActual?.categoria_iva || '').toLowerCase().includes('inscripto') ? 'FACTURA A' : 'FACTURA B'}
            </button>
          </div>
        </div>

      </div>

      {mostrarModalABM && <ModalCliente clienteAEditar={clienteAEditar} onClose={() => setMostrarModalABM(false)} onGuardarExito={(datosFrescos) => { if (datosFrescos) setClienteActual(datosFrescos); }} />}
      {mostrarModalDiccionario && <ModalDiccionario onClose={() => setMostrarModalDiccionario(false)} />}
      {productoParaSubirFoto && <ModalSubirFoto producto={productoParaSubirFoto} onClose={() => setProductoParaSubirFoto(null)} onExito={() => { ejecutarBusqueda(busqueda); }} />}

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
                <div className="flex justify-between"><p>SUBTOTAL:</p><p>$ {ticketAImprimir.subtotal.toFixed(2).replace('.', ',')}</p></div>
                <div className="flex justify-between"><p>DESCUENTO:</p><p>$ {((ticketAImprimir.subtotal * (ticketAImprimir.descuento / 100)) || 0).toFixed(2).replace('.', ',')}</p></div>
                <div className="flex justify-between mt-1 font-bold text-sm"><p>TOTAL:</p><p>$ {ticketAImprimir.total.toFixed(2).replace('.', ',')}</p></div>
              </div>

              {/* MOSTRAR DESGLOSE DE PAGO MIXTO EN EL TICKET */}
              {ticketAImprimir.metodo_pago === 'MIXTO' && (
                <div className="text-xs mt-2 border-t border-black border-dashed pt-1">
                  <div className="flex justify-between"><p>PAGÓ EN EFECTIVO:</p><p>$ {(ticketAImprimir.monto_efectivo).toFixed(2).replace('.', ',')}</p></div>
                  <div className="flex justify-between"><p>PAGÓ CON TARJETA:</p><p>$ {(ticketAImprimir.monto_tarjeta).toFixed(2).replace('.', ',')}</p></div>
                </div>
              )}

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
                <div className="flex justify-between"><p>Descripcion</p><p>Total</p></div>
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

              {/* MOSTRAR DESGLOSE DE PAGO MIXTO EN EL TICKET */}
              {ticketAImprimir.metodo_pago === 'MIXTO' && (
                <div className="text-xs mt-2 border-t border-black border-dashed pt-1">
                  <div className="flex justify-between"><p>PAGÓ EN EFECTIVO:</p><p>$ {(ticketAImprimir.monto_efectivo).toFixed(2).replace('.', ',')}</p></div>
                  <div className="flex justify-between"><p>PAGÓ CON TARJETA:</p><p>$ {(ticketAImprimir.monto_tarjeta).toFixed(2).replace('.', ',')}</p></div>
                </div>
              )}

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
    </div>
  );
}

export default App;