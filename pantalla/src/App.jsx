import { useState } from 'react';

function App() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [sugerencia, setSugerencia] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  
  // Estados estrictos
  const [vendedor, setVendedor] = useState(null);
  const [condicionPago, setCondicionPago] = useState(null); // CONTADO o CUENTA_CORRIENTE
  const [metodoPago, setMetodoPago] = useState(null); // EFECTIVO o TARJETA

  // Lista de vendedores con los IDs exactos de DUX
  const listaVendedores = [
    { id: 6257259, nombre: "PABLO" },
    { id: 15543779, nombre: "MAURICIO" },
    { id: 6257260, nombre: "VALENTÍN" }
  ];

  const ejecutarBusqueda = async (texto) => {
    try {
      const respuesta = await fetch(`http://192.168.88.250:5000/api/productos?q=${texto}`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setResultados(datos.resultados || []);
        setSugerencia(datos.sugerencia || null);
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
      if (sugerencia) {
        aplicarSugerencia();
      }
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.codigo === producto.codigo);
    if (existe) {
      setCarrito(carrito.map(item =>
        item.codigo === producto.codigo
          ? { ...item, cantidad: parseFloat(item.cantidad) + 1 }
          : item
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
            if (numValor > item.precio_original) {
              nuevoItem.descuento = 0;
            } else {
              nuevoItem.descuento = (((item.precio_original - numValor) / item.precio_original) * 100).toFixed(2);
            }
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
  const totalFinalCalculado = subtotalCarrito * (1 - ((parseFloat(descuentoTotal) || 0) / 100));

  const finalizarVenta = async (tipo_comprobante) => {
    if (carrito.length === 0) return;
    
    if (!vendedor) {
      alert("⚠️ Seleccioná el VENDEDOR (Pablo, Mauricio o Valentín) arriba del ticket.");
      return;
    }
    
    // Validamos la lógica de 2 pasos
    if (tipo_comprobante === 'comprobante_venta' || tipo_comprobante === 'factura') {
      if (!condicionPago) {
        alert("⚠️ Seleccioná la CONDICIÓN DE PAGO (Contado o Cta. Corriente).");
        return;
      }
      if (condicionPago === 'CONTADO' && !metodoPago) {
        alert("⚠️ Para ventas al CONTADO, tenés que indicar si es EFECTIVO o TARJETA.");
        return;
      }
    }
    
    const paquete_dux = {
      tipo: tipo_comprobante,
      items: carrito,
      descuento_total: descuentoTotal,
      id_personal: vendedor,
      condicion_pago: condicionPago, // Envía CONTADO o CUENTA_CORRIENTE
      metodo_pago: metodoPago,       // Envía EFECTIVO, TARJETA o null
      total_final: totalFinalCalculado.toFixed(2) 
    };

    try {
      const respuesta = await fetch('http://192.168.88.250:5000/api/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paquete_dux)
      });
      
      const datos_respuesta = await respuesta.json();
      
      if (datos_respuesta.status === 'ok') {
        alert(`✅ ${tipo_comprobante.toUpperCase()} procesado correctamente.`);
        // Limpiamos mostrador
        setCarrito([]);
        setDescuentoTotal(0);
        setBusqueda('');
        setResultados([]);
        setCondicionPago(null); 
        setMetodoPago(null); 
      } else {
        alert("❌ Error: " + datos_respuesta.error);
      }
      
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Hubo un error de red al comunicarse con el servidor local.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-2 md:p-4 font-sans flex flex-col md:flex-row gap-4 touch-manipulation">
      {/* Columna Izquierda: Buscador */}
      <div className="flex-[3] bg-white rounded-xl shadow-lg flex flex-col h-[95vh]">
        <div className="bg-blue-700 p-4 text-white">
          <h1 className="text-2xl font-black">GUN - Mostrador</h1>
        </div>
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Escriba para buscar código o producto..."
            className="w-full p-4 text-2xl border-2 rounded-xl focus:outline-none focus:border-blue-600"
            value={busqueda}
            onChange={manejarEscritura}
            onKeyDown={manejarTeclado}
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {resultados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4">
              {sugerencia ? (
                <div className="text-center bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <p className="text-gray-500 text-lg mb-2">No encontramos nada exacto.</p>
                  <p className="text-xl flex items-center justify-center">
                    ¿Quisiste decir{' '}
                    <button 
                      onClick={aplicarSugerencia} 
                      className="text-blue-700 font-black text-2xl hover:underline cursor-pointer bg-white px-3 py-1 rounded shadow-sm border mx-2"
                    >
                      {sugerencia}
                    </button>
                    ? 
                  </p>
                  <div className="mt-4 inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                    Atajo: Presioná F1
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-lg">Comience a escribir...</div>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {resultados.map((prod, index) => (
                <li 
                  key={index} 
                  onClick={() => agregarAlCarrito(prod)}
                  className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center hover:border-blue-500 cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-800">{prod.nombre}</p>
                    <p className="text-sm text-gray-500">Cód: {prod.codigo}</p>
                  </div>
                  <div className="text-2xl font-black text-green-700">
                    ${parseFloat(prod.precio).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna Derecha: Carrito y Checkout */}
      <div className="flex-[2] bg-white rounded-xl shadow-lg flex flex-col h-[95vh] p-4">
        
        {/* Selector de Vendedor */}
        <div className="flex items-center gap-3 border-b pb-3 mb-3">
          <span className="font-bold text-gray-800 uppercase tracking-wide">Vendedor:</span>
          <div className="flex gap-2">
            {listaVendedores.map(v => (
              <button 
                key={v.id}
                onClick={() => setVendedor(v.id)}
                className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm
                  ${vendedor === v.id ? 'bg-blue-800 text-white border-2 border-blue-900' : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'}`}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {carrito.map((item, i) => {
            const precioCobrado = parseFloat(item.precio_cobrado) || 0;
            const precioOriginal = parseFloat(item.precio_original) || 0;
            const diferencia = precioCobrado - precioOriginal;

            return (
              <div key={i} className="p-3 bg-gray-50 border rounded-lg flex flex-col gap-3 relative">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 leading-tight">{item.nombre}</span>
                    {diferencia < -0.01 && (
                      <span className="text-xs text-orange-500 font-bold">
                        Precio original: ${precioOriginal.toFixed(2)}
                      </span>
                    )}
                    {diferencia > 0.01 && (
                      <span className="text-xs text-red-600 font-bold">
                        Recargo aplicado: +${diferencia.toFixed(2)} (Base: ${precioOriginal.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => eliminarItem(item.codigo)}
                    className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded hover:bg-red-200 ml-2"
                  >
                    X
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center text-sm mt-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold mb-1">Cant.</span>
                    <input 
                      type="number" 
                      className="w-16 p-2 border rounded text-center font-bold"
                      value={item.cantidad}
                      onChange={(e) => modificarItem(item.codigo, 'cantidad', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      min="1"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-bold mb-1">Precio Final ($)</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-24 p-2 border border-blue-200 bg-blue-50 rounded font-bold text-blue-800"
                      value={item.precio_cobrado}
                      onChange={(e) => modificarItem(item.codigo, 'precio_cobrado', e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-orange-600 font-bold mb-1">Desc. (%)</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-20 p-2 border border-orange-200 bg-orange-50 rounded font-bold text-orange-700 text-center"
                      value={item.descuento}
                      onChange={(e) => modificarItem(item.codigo, 'descuento', e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  <div className="ml-auto flex flex-col items-end">
                    <span className="text-xs text-gray-500 font-bold mb-1">Subtotal</span>
                    <span className="font-black text-lg text-green-700">
                      ${calcularSubtotalItem(item).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t flex flex-col gap-3">
          <div className="flex justify-between items-center text-gray-600 font-bold px-2">
            <span>Subtotal Bruto:</span>
            <span>${subtotalCarrito.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center bg-orange-100 p-2 rounded-lg border border-orange-200">
            <span className="font-bold text-orange-800">Descuento Total (%)</span>
            <input 
              type="number"
              step="0.01"
              className="w-24 p-2 border border-orange-300 rounded text-right font-bold text-orange-700 focus:outline-none"
              value={descuentoTotal}
              onChange={(e) => setDescuentoTotal(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* PASO 1: Condición de Pago */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-300">
            <span className="font-bold text-gray-800 uppercase text-sm">Condición:</span>
            <div className="flex gap-2">
              <button 
                onClick={() => { setCondicionPago('CONTADO'); setMetodoPago(null); }} 
                className={`px-3 py-2 rounded font-bold transition-colors shadow-sm text-sm
                  ${condicionPago === 'CONTADO' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
              >
                CONTADO
              </button>
              <button 
                onClick={() => { setCondicionPago('CUENTA_CORRIENTE'); setMetodoPago(null); }} 
                className={`px-3 py-2 rounded font-bold transition-colors shadow-sm text-sm
                  ${condicionPago === 'CUENTA_CORRIENTE' ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
              >
                CTA. CORRIENTE
              </button>
            </div>
          </div>

          {/* PASO 2: Método de pago (SE MUESTRA SOLO SI ES CONTADO) */}
          {condicionPago === 'CONTADO' && (
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="font-bold text-blue-900 uppercase text-sm">Método:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMetodoPago('EFECTIVO')} 
                  className={`px-3 py-2 rounded font-bold transition-colors shadow-sm text-sm
                    ${metodoPago === 'EFECTIVO' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
                >
                  EFECTIVO
                </button>
                <button 
                  onClick={() => setMetodoPago('TARJETA')} 
                  className={`px-3 py-2 rounded font-bold transition-colors shadow-sm text-sm
                    ${metodoPago === 'TARJETA' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
                >
                  TARJETA
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm mb-2 mt-1">
            <span className="text-xl font-black text-blue-900">TOTAL</span>
            <span className="text-4xl font-black text-blue-700">
              ${totalFinalCalculado.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => finalizarVenta('presupuesto')}
              disabled={carrito.length === 0}
              className={`p-3 rounded-lg font-bold text-sm md:text-base text-white shadow-md transition-colors 
                ${carrito.length > 0 ? 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              PRESUPUESTO
            </button>
            <button 
              onClick={() => finalizarVenta('comprobante_venta')}
              disabled={carrito.length === 0}
              className={`p-3 rounded-lg font-bold text-sm md:text-base text-white shadow-md transition-colors 
                ${carrito.length > 0 ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' : 'bg-blue-300 cursor-not-allowed'}`}
            >
              C. VENTA
            </button>
            <button 
              onClick={() => finalizarVenta('factura')}
              disabled={carrito.length === 0}
              className={`p-3 rounded-lg font-bold text-sm md:text-base text-white shadow-md transition-colors 
                ${carrito.length > 0 ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' : 'bg-green-300 cursor-not-allowed'}`}
            >
              FACTURA
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;