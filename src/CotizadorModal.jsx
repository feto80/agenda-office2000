  import React, { useState, useEffect } from 'react';

  export function CotizadorView({ onVolver }) {
    // ESTADOS PRINCIPALES DE PESTAÑAS
    const [activeTab, setActiveTab] = useState('form');

    // CAMPOS FORMULARIO PRINCIPAL
    const [presupuestoRef, setPresupuestoRef] = useState('');
    const [tipoCambio, setTipoCambio] = useState(42);
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteTel, setClienteTel] = useState('');
    const [presupuestoConcepto, setPresupuestoConcepto] = useState('');
    const [fechaPresupuesto, setFechaPresupuesto] = useState('');

    // TABLAS DE ÍTEMS
    const [materiales, setMateriales] = useState([]);
    const [manoObra, setManoObra] = useState([]);

    // BÚSQUEDA HISTORIAL Y CATÁLOGO
    const [busquedaHistorial, setBusquedaHistorial] = useState('');
    const [historialDB, setHistorialDB] = useState([]);
    const [catalogoDB, setCatalogoDB] = useState([]);

    // FORMULARIO CATÁLOGO
    const [cfgTipo, setCfgTipo] = useState('MO');
    const [cfgCodigo, setCfgCodigo] = useState('');
    const [cfgDesc, setCfgDesc] = useState('');
    const [cfgMoneda, setCfgMoneda] = useState('UYU');
    const [cfgPrecio, setCfgPrecio] = useState('');
    const [cfgIva, setCfgIva] = useState(false);
    const [cfgRecargo, setCfgRecargo] = useState(false);

    // EDICIÓN EN LÍNEA CATÁLOGO
    const [editingCode, setEditingCode] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
      const dbHist = JSON.parse(localStorage.getItem('presupuestos_db')) || [];
      const dbCat = JSON.parse(localStorage.getItem('catalogo_precios_db')) || [];
      setHistorialDB(dbHist);
      setCatalogoDB(dbCat);
      limpiarFormulario(dbHist);
    }, []);

    const obtenerSiguienteRef = (db = historialDB) => {
      if (!db || db.length === 0) return 'PRE-1001';
      let maxNum = 1000;
      db.forEach(item => {
        if (item.ref) {
          const numStr = item.ref.replace(/\D/g, '');
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      return 'PRE-' + (maxNum + 1);
    };

    const agregarFila = (tipo) => {
      const nuevaFila = {
        id: Date.now() + Math.random(),
        codigo: '',
        cant: 1,
        desc: '',
        moneda: 'UYU',
        precio: 0,
        iva: false,
        recargo: false
      };
      if (tipo === 'MAT') setMateriales(prev => [...prev, nuevaFila]);
      else setManoObra(prev => [...prev, nuevaFila]);
    };

    const eliminarFila = (tipo, id) => {
      if (tipo === 'MAT') setMateriales(prev => prev.filter(f => f.id !== id));
      else setManoObra(prev => prev.filter(f => f.id !== id));
    };

    const handleFilaChange = (tipo, id, field, value) => {
      const updateFn = (list) => list.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'codigo') {
          const codUpper = value.trim().toUpperCase();
          const encontrado = catalogoDB.find(c => c.tipo === tipo && c.codigo.toUpperCase() === codUpper);
          if (encontrado) {
            updated.desc = encontrado.desc;
            updated.moneda = encontrado.moneda;
            updated.precio = encontrado.precio;
            updated.iva = encontrado.iva;
            updated.recargo = encontrado.recargo;
          }
        }
        return updated;
      });
      if (tipo === 'MAT') setMateriales(updateFn);
      else setManoObra(updateFn);
    };

    const limpiarFormularioConfirmado = () => {
      if (window.confirm("¿Estás seguro de que deseas vaciar todos los campos para crear un NUEVO presupuesto?")) {
        limpiarFormulario();
      }
    };

    const limpiarFormulario = (dbActual = historialDB) => {
      setPresupuestoRef(obtenerSiguienteRef(dbActual));
      setClienteNombre('');
      setClienteTel('');
      setPresupuestoConcepto('');
      setFechaPresupuesto(new Date().toISOString().split('T')[0]);

      setMateriales([{ id: 1, codigo: '', cant: 1, desc: '', moneda: 'UYU', precio: 0, iva: false, recargo: false }]);
      setManoObra([{ id: 2, codigo: '', cant: 1, desc: '', moneda: 'UYU', precio: 0, iva: false, recargo: false }]);
    };

    const calcularTotalesTabla = (filas) => {
      const tc = parseFloat(tipoCambio) || 1;
      let totalPesos = 0;
      const filasCalculadas = filas.map(f => {
        const cant = parseFloat(f.cant) || 0;
        let precio = parseFloat(f.precio) || 0;
        if (f.moneda === 'USD') precio = precio * tc;
        const base = cant * precio;
        let totalFila = base;
        if (f.iva) totalFila += base * 0.22;
        if (f.recargo) totalFila += base * 0.20;
        totalPesos += totalFila;
        return { ...f, totalFila };
      });
      return { totalPesos, filasCalculadas };
    };

    const tc = parseFloat(tipoCambio) || 1;
    const resMat = calcularTotalesTabla(materiales);
    const resMO = calcularTotalesTabla(manoObra);

    const totalGeneralPesos = resMat.totalPesos + resMO.totalPesos;
    const totalGeneralUSD = totalGeneralPesos / tc;
    const sinIvaPesos = totalGeneralPesos / 1.22;
    const sinIvaUSD = totalGeneralUSD / 1.22;

    const guardarPresupuesto = () => {
      if (!presupuestoRef.trim() || !clienteNombre.trim()) {
        alert('Por favor, ingresa al menos la Referencia (N° Ref) y el Nombre del Cliente.');
        return;
      }
      let db = [...historialDB];
      const index = db.findIndex(item => item.ref.toLowerCase() === presupuestoRef.trim().toLowerCase());
      if (index >= 0 && !window.confirm(`El presupuesto ${presupuestoRef} ya existe.\n¿Deseas actualizarlo?`)) return;

      const nuevoPresupuesto = {
        ref: presupuestoRef.trim(),
        tc: tipoCambio,
        cliente: clienteNombre.trim(),
        tel: clienteTel.trim(),
        concepto: presupuestoConcepto.trim(),
        fecha: fechaPresupuesto,
        materiales,
        manoObra,
        total: totalGeneralPesos.toFixed(2)
      };

      if (index >= 0) db[index] = nuevoPresupuesto;
      else db.push(nuevoPresupuesto);

      localStorage.setItem('presupuestos_db', JSON.stringify(db));
      setHistorialDB(db);
      alert(`¡Presupuesto ${presupuestoRef} guardado con éxito!`);
    };

    const cargarPresupuesto = (ref) => {
      const p = historialDB.find(item => item.ref === ref);
      if (!p) return;
      setPresupuestoRef(p.ref);
      setTipoCambio(p.tc);
      setClienteNombre(p.cliente);
      setClienteTel(p.tel);
      setPresupuestoConcepto(p.concepto);
      setFechaPresupuesto(p.fecha);
      setMateriales(p.materiales || []);
      setManoObra(p.manoObra || []);
      setActiveTab('form');
    };

    const eliminarPresupuesto = (ref) => {
      if (window.confirm(`¿Estás seguro de eliminar el presupuesto ${ref}?`)) {
        const db = historialDB.filter(item => item.ref !== ref);
        localStorage.setItem('presupuestos_db', JSON.stringify(db));
        setHistorialDB(db);
      }
    };

    const enviarWhatsApp = () => {
      const subtotalUSDFormatted = `U$S ${sinIvaUSD.toFixed(2)}`;
      const saludo = new Date().getHours() < 12 ? 'Buenos días' : 'Buenas tardes';

      let numLimpio = clienteTel.replace(/\D/g, '');
      if (numLimpio.startsWith('0')) numLimpio = numLimpio.substring(1);
      if (!numLimpio.startsWith('598') && numLimpio.length > 0) numLimpio = '598' + numLimpio;

      let mensaje = `${saludo}${clienteNombre ? ' ' + clienteNombre : ''},\n`;
      mensaje += `Le enviamos el presupuesto solicitado: *${presupuestoConcepto || 'Presupuesto'}*\n\n`;
      mensaje += `*Costo total:* ${subtotalUSDFormatted} + IVA\n\n`;
      mensaje += `Puede financiar el importe en cuotas con cualquier medio de pago o, si lo prefiere, en cuenta corriente.\n\n`;
      mensaje += `Quedamos a las órdenes por cualquier consulta.`;

      let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
      if (numLimpio.length > 0) url += `&phone=${numLimpio}`;
      window.open(url, '_blank');
    };

const imprimirFichaTecnica = () => {
    // 1. Crea la etiqueta <style> temporal con ajuste para evitar la página en blanco
    const style = document.createElement('style');
    style.id = 'print-style-override';
    style.innerHTML = `
      @media print {
        @page { 
          margin: 0; 
        }
        html, body {
          height: 100%;
          overflow: hidden; /* Evita que milímetros extra generen una 2da hoja */
        }
        body { 
          padding: 10mm; /* Disminuimos ligeramente el margen para asegurar que entre en 1 hoja */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);

    // 2. Abre la ventana de impresión
    window.print();

    // 3. Remueve el estilo temporal
    setTimeout(() => {
      const el = document.getElementById('print-style-override');
      if (el) el.remove();
    }, 1000);
  };

    const guardarItemCatalogo = () => {
      const codUpper = cfgCodigo.trim().toUpperCase();
      if (!codUpper || !cfgDesc.trim()) return alert('Ingresa Código y Descripción.');

      let db = [...catalogoDB];
      const existeIndex = db.findIndex(i => i.codigo.toUpperCase() === codUpper);
      if (existeIndex >= 0 && !window.confirm(`El código "${codUpper}" ya existe. ¿Deseas reemplazarlo?`)) return;

      const nuevoItem = {
        tipo: cfgTipo,
        codigo: codUpper,
        desc: cfgDesc.trim(),
        moneda: cfgMoneda,
        precio: parseFloat(cfgPrecio) || 0,
        iva: cfgIva,
        recargo: cfgRecargo
      };

      if (existeIndex >= 0) db[existeIndex] = nuevoItem;
      else db.push(nuevoItem);

      localStorage.setItem('catalogo_precios_db', JSON.stringify(db));
      setCatalogoDB(db);
      setCfgCodigo(''); setCfgDesc(''); setCfgPrecio(''); setCfgIva(false); setCfgRecargo(false);
    };

    const eliminarItemCatalogo = (codigo) => {
      if (window.confirm(`¿Eliminar ${codigo} del catálogo?`)) {
        const db = catalogoDB.filter(i => i.codigo !== codigo);
        localStorage.setItem('catalogo_precios_db', JSON.stringify(db));
        setCatalogoDB(db);
      }
    };

    const iniciarEdicionCatalogo = (item) => { setEditingCode(item.codigo); setEditData({ ...item }); };

    const guardarEdicionCatalogo = () => {
      let db = [...catalogoDB];
      const idx = db.findIndex(i => i.codigo === editingCode);
      if (idx !== -1) {
        db[idx] = { ...editData, codigo: editData.codigo.trim().toUpperCase() };
        localStorage.setItem('catalogo_precios_db', JSON.stringify(db));
        setCatalogoDB(db);
      }
      setEditingCode(null);
    };

    const historialFiltrado = historialDB.filter(item =>
      (item.cliente && item.cliente.toLowerCase().includes(busquedaHistorial.toLowerCase())) ||
      (item.concepto && item.concepto.toLowerCase().includes(busquedaHistorial.toLowerCase())) ||
      (item.ref && item.ref.toLowerCase().includes(busquedaHistorial.toLowerCase()))
    );

    return (
      <div className="w-full min-h-screen bg-[#f0f4f8] text-[#333] p-4 sm:p-8">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-only-tech, .print-only-tech * { visibility: visible; }
            .print-only-tech {
              position: absolute; left: 0; top: 0; width: 100%;
              display: block !important; padding: 15mm !important;
              color: #000 !important; background: #fff !important;
            }
          }
        `}</style>

        <div className="w-full max-w-7xl mx-auto bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200">
          
          {/* BARRA SUPERIOR PANTALLA COMPLETA */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'form' ? 'bg-[#1e3a8a] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ✏️ Nueva Cotización
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'historial' ? 'bg-[#1e3a8a] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📋 Historial ({historialDB.length})
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'config' ? 'bg-[#1e3a8a] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚙️ Configuración
              </button>
            </div>

            <div className="flex gap-2 items-center">
              {activeTab === 'form' && (
                <button
                  onClick={limpiarFormularioConfirmado}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                >
                  🗑️ Limpiar Campos
                </button>
              )}
              {onVolver && (
                <button
                  onClick={onVolver}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs transition-all"
                >
                  ← Volver Agenda
                </button>
              )}
            </div>
          </div>

          {/* CONTENIDO FORMULARIO */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-wide">PRESUPUESTO</h1>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                    N° Ref: 
                    <input
                      type="text"
                      value={presupuestoRef}
                      onChange={(e) => setPresupuestoRef(e.target.value)}
                      className="font-bold text-slate-700 bg-slate-50 border-b border-dashed border-slate-400 focus:outline-none w-28 px-1"
                    />
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-400 px-4 py-2 rounded-lg flex items-center gap-3">
                  <label className="text-xs font-bold text-blue-900">Tipo de Cambio (U$S 1 = $):</label>
                  <input
                    type="number"
                    value={tipoCambio}
                    onChange={(e) => setTipoCambio(e.target.value)}
                    className="w-16 p-1 text-center font-bold text-blue-900 border border-blue-300 rounded bg-white text-sm"
                  />
                </div>
              </div>

              {/* Datos Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Cliente / Empresa:</label>
                  <input type="text" placeholder="Ej: Junta Departamental" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Teléfono (WhatsApp):</label>
                  <input type="text" placeholder="Ej: 098950167" value={clienteTel} onChange={(e) => setClienteTel(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Concepto / Asunto:</label>
                  <input type="text" placeholder="Ej: Cotización de equipos" value={presupuestoConcepto} onChange={(e) => setPresupuestoConcepto(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Fecha:</label>
                  <input type="date" value={fechaPresupuesto} onChange={(e) => setFechaPresupuesto(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
              </div>

              <datalist id="listaCodigosMAT">
                {catalogoDB.filter(c => c.tipo === 'MAT').map(c => (
                  <option key={c.codigo} value={c.codigo}>{`${c.desc} ($ ${c.precio})`}</option>
                ))}
              </datalist>
              <datalist id="listaCodigosMO">
                {catalogoDB.filter(c => c.tipo === 'MO').map(c => (
                  <option key={c.codigo} value={c.codigo}>{`${c.desc} ($ ${c.precio})`}</option>
                ))}
              </datalist>

              {/* TABLA MATERIALES */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1">📦 Materiales y Equipos</span>
                  <button onClick={() => agregarFila('MAT')} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700">+ Material</button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2 w-16">Cant.</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 w-20">Moneda</th>
                        <th className="p-2 w-24">Precio Unit.</th>
                        <th className="p-2 text-center w-16">IVA 22%</th>
                        <th className="p-2 text-center w-20">Recargo 20%</th>
                        <th className="p-2 text-right w-28">Total ($)</th>
                        <th className="p-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resMat.filasCalculadas.map((fila) => (
                        <tr key={fila.id}>
                          <td className="p-1"><input type="text" list="listaCodigosMAT" value={fila.codigo} onChange={(e) => handleFilaChange('MAT', fila.id, 'codigo', e.target.value)} placeholder="Código" className="w-full p-1 border rounded bg-white uppercase" /></td>
                          <td className="p-1"><input type="number" value={fila.cant} onChange={(e) => handleFilaChange('MAT', fila.id, 'cant', e.target.value)} className="w-full p-1 border rounded bg-white text-center" /></td>
                          <td className="p-1"><input type="text" value={fila.desc} onChange={(e) => handleFilaChange('MAT', fila.id, 'desc', e.target.value)} placeholder="Descripción" className="w-full p-1 border rounded bg-white" /></td>
                          <td className="p-1">
                            <select value={fila.moneda} onChange={(e) => handleFilaChange('MAT', fila.id, 'moneda', e.target.value)} className="w-full p-1 border rounded bg-white">
                              <option value="USD">U$S</option>
                              <option value="UYU">$</option>
                            </select>
                          </td>
                          <td className="p-1"><input type="number" value={fila.precio} onChange={(e) => handleFilaChange('MAT', fila.id, 'precio', e.target.value)} className="w-full p-1 border rounded bg-white" /></td>
                          <td className="p-1 text-center"><input type="checkbox" checked={fila.iva} onChange={(e) => handleFilaChange('MAT', fila.id, 'iva', e.target.checked)} /></td>
                          <td className="p-1 text-center"><input type="checkbox" checked={fila.recargo} onChange={(e) => handleFilaChange('MAT', fila.id, 'recargo', e.target.checked)} /></td>
                          <td className="p-1 text-right font-bold text-slate-800">$ {fila.totalFila.toFixed(2)}</td>
                          <td className="p-1 text-center"><button onClick={() => eliminarFila('MAT', fila.id)} className="text-red-500 font-bold px-1">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA MANO DE OBRA */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1">🛠️ Mano de Obra</span>
                  <button onClick={() => agregarFila('MO')} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700">+ Servicio</button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2 w-16">Cant.</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 w-20">Moneda</th>
                        <th className="p-2 w-24">Precio Unit.</th>
                        <th className="p-2 text-center w-16">IVA 22%</th>
                        <th className="p-2 text-center w-20">Recargo 20%</th>
                        <th className="p-2 text-right w-28">Total ($)</th>
                        <th className="p-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resMO.filasCalculadas.map((fila) => (
                        <tr key={fila.id}>
                          <td className="p-1"><input type="text" list="listaCodigosMO" value={fila.codigo} onChange={(e) => handleFilaChange('MO', fila.id, 'codigo', e.target.value)} placeholder="Código" className="w-full p-1 border rounded bg-white uppercase" /></td>
                          <td className="p-1"><input type="number" value={fila.cant} onChange={(e) => handleFilaChange('MO', fila.id, 'cant', e.target.value)} className="w-full p-1 border rounded bg-white text-center" /></td>
                          <td className="p-1"><input type="text" value={fila.desc} onChange={(e) => handleFilaChange('MO', fila.id, 'desc', e.target.value)} placeholder="Descripción" className="w-full p-1 border rounded bg-white" /></td>
                          <td className="p-1">
                            <select value={fila.moneda} onChange={(e) => handleFilaChange('MO', fila.id, 'moneda', e.target.value)} className="w-full p-1 border rounded bg-white">
                              <option value="USD">U$S</option>
                              <option value="UYU">$</option>
                            </select>
                          </td>
                          <td className="p-1"><input type="number" value={fila.precio} onChange={(e) => handleFilaChange('MO', fila.id, 'precio', e.target.value)} className="w-full p-1 border rounded bg-white" /></td>
                          <td className="p-1 text-center"><input type="checkbox" checked={fila.iva} onChange={(e) => handleFilaChange('MO', fila.id, 'iva', e.target.checked)} /></td>
                          <td className="p-1 text-center"><input type="checkbox" checked={fila.recargo} onChange={(e) => handleFilaChange('MO', fila.id, 'recargo', e.target.checked)} /></td>
                          <td className="p-1 text-right font-bold text-slate-800">$ {fila.totalFila.toFixed(2)}</td>
                          <td className="p-1 text-center"><button onClick={() => eliminarFila('MO', fila.id)} className="text-red-500 font-bold px-1">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RESUMEN DE TOTALES */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">Resumen de Totales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total Materiales:</span>
                      <span className="font-bold text-slate-800">$ {resMat.totalPesos.toFixed(2)} | U$S {(resMat.totalPesos / tc).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total Mano de Obra:</span>
                      <span className="font-bold text-slate-800">$ {resMO.totalPesos.toFixed(2)} | U$S {(resMO.totalPesos / tc).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-[#1b3bbb] text-white p-5 rounded-xl shadow-lg space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-85 block">TOTAL PRESUPUESTADO</span>
                    <div className="text-3xl font-black flex items-baseline gap-2">
                      <span>$</span>
                      <span>{totalGeneralPesos.toFixed(2)}</span>
                      <span className="text-xs font-semibold opacity-85">UYU</span>
                    </div>
                    <div className="text-xs font-medium opacity-90">U$S {totalGeneralUSD.toFixed(2)} USD</div>
                    <div className="border-t border-white/20 pt-2 mt-2 flex justify-between text-xs font-medium opacity-95">
                      <span>Subtotal (Sin IVA):</span>
                      <span className="font-bold">$ {sinIvaPesos.toFixed(2)} | U$S {sinIvaUSD.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={guardarPresupuesto} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1">💾 Guardar</button>
                <button onClick={enviarWhatsApp} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1">💬 WhatsApp</button>
                <button onClick={imprimirFichaTecnica} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1">🛠️ Imprimir</button>
              </div>

              {/* FICHA TÉCNICA IMPRESIÓN */}
              <div className="print-only-tech hidden">
                <div className="flex justify-between items-end border-b-2 border-blue-900 pb-2 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">HOJA DE TRABAJO TÉCNICA / FICHA DE COSTOS</h2>
                    <div className="text-xs text-slate-600">Office 2000 - Servicio Técnico</div>
                  </div>
                  <div className="text-right text-xs">
                    <div><strong>Ref:</strong> {presupuestoRef}</div>
                    <div><strong>Fecha:</strong> {fechaPresupuesto}</div>
                    <div><strong>T.C.:</strong> $ {tipoCambio}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-slate-50 p-2 border border-slate-300">
                  <div><strong>Cliente:</strong> {clienteNombre}</div>
                  <div><strong>Teléfono:</strong> {clienteTel}</div>
                  <div className="col-span-2"><strong>Concepto:</strong> {presupuestoConcepto}</div>
                </div>

                <div className="text-xs font-bold text-blue-900 mb-1">MATERIALES Y EQUIPOS</div>
                <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border p-1">Código</th>
                      <th className="border p-1">Cant.</th>
                      <th className="border p-1">Descripción</th>
                      <th className="border p-1">P. Unit</th>
                      <th className="border p-1">IVA</th>
                      <th className="border p-1">20%</th>
                      <th className="border p-1 text-right">Total Net ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resMat.filasCalculadas.map((m, idx) => (
                      <tr key={idx}>
                        <td className="border p-1">{m.codigo}</td>
                        <td className="border p-1">{m.cant}</td>
                        <td className="border p-1">{m.desc}</td>
                        <td className="border p-1">{m.moneda === 'USD' ? 'U$S' : '$'} {parseFloat(m.precio).toFixed(2)}</td>
                        <td className="border p-1">{m.iva ? 'Sí' : 'No'}</td>
                        <td className="border p-1">{m.recargo ? 'Sí' : 'No'}</td>
                        <td className="border p-1 text-right font-bold">$ {m.totalFila.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-xs font-bold text-blue-900 mb-1">MANO DE OBRA Y SERVICIOS</div>
                <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border p-1">Código</th>
                      <th className="border p-1">Cant.</th>
                      <th className="border p-1">Descripción</th>
                      <th className="border p-1">P. Unit</th>
                      <th className="border p-1">IVA</th>
                      <th className="border p-1">20%</th>
                      <th className="border p-1 text-right">Total Net ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resMO.filasCalculadas.map((m, idx) => (
                      <tr key={idx}>
                        <td className="border p-1">{m.codigo}</td>
                        <td className="border p-1">{m.cant}</td>
                        <td className="border p-1">{m.desc}</td>
                        <td className="border p-1">{m.moneda === 'USD' ? 'U$S' : '$'} {parseFloat(m.precio).toFixed(2)}</td>
                        <td className="border p-1">{m.iva ? 'Sí' : 'No'}</td>
                        <td className="border p-1">{m.recargo ? 'Sí' : 'No'}</td>
                        <td className="border p-1 text-right font-bold">$ {m.totalFila.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="float-right w-80 text-xs border-t-2 border-blue-900 pt-2 space-y-1">
                  <div className="flex justify-between"><span>Total Materiales:</span><span>$ {resMat.totalPesos.toFixed(2)} | U$S {(resMat.totalPesos/tc).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Total Mano de Obra:</span><span>$ {resMO.totalPesos.toFixed(2)} | U$S {(resMO.totalPesos/tc).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t border-black pt-1">
                    <span>TOTAL:</span>
                    <span>$ {totalGeneralPesos.toFixed(2)} | U$S {totalGeneralUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1"><span>Subtotal (Sin IVA):</span><span>$ {sinIvaPesos.toFixed(2)} | U$S {sinIvaUSD.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA HISTORIAL */}
          {activeTab === 'historial' && (
            <div>
              <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                <h2 className="text-lg font-bold text-slate-800">📋 Presupuestos Guardados</h2>
                <input type="text" placeholder="🔍 Buscar por cliente o concepto..." value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-xs w-64" />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-2">N° Ref</th>
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Cliente</th>
                      <th className="p-2">Concepto</th>
                      <th className="p-2">Total ($)</th>
                      <th className="p-2 text-center w-48">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {historialFiltrado.length === 0 ? (
                      <tr><td colSpan="6" className="p-4 text-center text-slate-400">No se encontraron presupuestos.</td></tr>
                    ) : (
                      historialFiltrado.map((p) => (
                        <tr key={p.ref} className="hover:bg-slate-50">
                          <td className="p-2 font-bold">{p.ref}</td>
                          <td className="p-2">{p.fecha}</td>
                          <td className="p-2">{p.cliente}</td>
                          <td className="p-2">{p.concepto}</td>
                          <td className="p-2 font-bold">$ {p.total}</td>
                          <td className="p-2 text-center">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => cargarPresupuesto(p.ref)} className="bg-blue-600 text-white px-2 py-1 rounded text-[11px] font-semibold">Cargar</button>
                              <button onClick={() => { cargarPresupuesto(p.ref); setTimeout(imprimirFichaTecnica, 200); }} className="bg-red-600 text-white px-2 py-1 rounded text-[11px] font-semibold">📄 PDF</button>
                              <button onClick={() => eliminarPresupuesto(p.ref)} className="bg-slate-500 text-white px-2 py-1 rounded text-[11px] font-semibold">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA CONFIGURACIÓN */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">⚙️ Catálogo de Precios Predefinidos</h2>
                <p className="text-xs text-slate-500">Agrega servicios o materiales para autocompletar automáticamente al escribir el código.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 items-end">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Categoría</label>
                  <select value={cfgTipo} onChange={(e) => setCfgTipo(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white">
                    <option value="MO">Mano de Obra</option>
                    <option value="MAT">Material / Equipo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Código</label>
                  <input type="text" placeholder="Ej: 68001" value={cfgCodigo} onChange={(e) => setCfgCodigo(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white uppercase" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Descripción</label>
                  <input type="text" placeholder="Ej: Hora Calificada Home" value={cfgDesc} onChange={(e) => setCfgDesc(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Moneda</label>
                  <select value={cfgMoneda} onChange={(e) => setCfgMoneda(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white">
                    <option value="UYU">$ (UYU)</option>
                    <option value="USD">U$S (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Precio Unit.</label>
                  <input type="number" placeholder="0" value={cfgPrecio} onChange={(e) => setCfgPrecio(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-xs bg-white" />
                </div>
                <div className="flex gap-4 justify-center items-center py-2">
                  <label className="flex flex-col items-center text-[10px] font-bold text-slate-600">
                    IVA 22%
                    <input type="checkbox" checked={cfgIva} onChange={(e) => setCfgIva(e.target.checked)} />
                  </label>
                  <label className="flex flex-col items-center text-[10px] font-bold text-slate-600">
                    Recargo 20%
                    <input type="checkbox" checked={cfgRecargo} onChange={(e) => setCfgRecargo(e.target.checked)} />
                  </label>
                </div>
              </div>

              <button onClick={guardarItemCatalogo} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all">➕ Guardar en Catálogo</button>

{/* TABLA CATÁLOGO MO */}
              <div>
                <h3 className="font-bold text-slate-800 text-xs mb-2">🛠️ Mano de Obra</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 w-16">Moneda</th>
                        <th className="p-2 w-20">Precio</th>
                        <th className="p-2 w-12 text-center">IVA</th>
                        <th className="p-2 w-16 text-center">Recargo</th>
                        <th className="p-2 w-48 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {catalogoDB.filter(c => c.tipo === 'MO').map(item => (
                        <tr key={item.codigo}>
                          {editingCode === item.codigo ? (
                            <>
                              <td className="p-1"><input type="text" value={editData.codigo} onChange={(e) => setEditData({ ...editData, codigo: e.target.value })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1"><input type="text" value={editData.desc} onChange={(e) => setEditData({ ...editData, desc: e.target.value })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1"><select value={editData.moneda} onChange={(e) => setEditData({ ...editData, moneda: e.target.value })} className="w-full p-1 border rounded"><option value="UYU">$</option><option value="USD">U$S</option></select></td>
                              <td className="p-1"><input type="number" value={editData.precio} onChange={(e) => setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1 text-center"><input type="checkbox" checked={editData.iva} onChange={(e) => setEditData({ ...editData, iva: e.target.checked })} /></td>
                              <td className="p-1 text-center"><input type="checkbox" checked={editData.recargo} onChange={(e) => setEditData({ ...editData, recargo: e.target.checked })} /></td>
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={guardarEdicionCatalogo} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px]">✔ Guardar</button>
                                  <button onClick={() => setEditingCode(null)} className="bg-slate-400 text-white px-2 py-1 rounded text-[10px]">✕ Cancelar</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 font-bold">{item.codigo}</td>
                              <td className="p-2">{item.desc}</td>
                              <td className="p-2">{item.moneda === 'USD' ? 'U$S' : '$'}</td>
                              <td className="p-2">{parseFloat(item.precio).toFixed(2)}</td>
                              <td className="p-2 text-center">{item.iva ? 'Sí' : 'No'}</td>
                              <td className="p-2 text-center">{item.recargo ? 'Sí' : 'No'}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  <button onClick={() => iniciarEdicionCatalogo(item)} className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1">✏️ Editar</button>
                                  <button onClick={() => eliminarItemCatalogo(item.codigo)} className="bg-slate-500 hover:bg-slate-600 text-white px-2.5 py-1 rounded text-[10px] font-semibold">🗑️ Eliminar</button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA CATÁLOGO MAT */}
              <div>
                <h3 className="font-bold text-slate-800 text-xs mb-2">📦 Materiales y Equipos</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-2 w-28">Código</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 w-16">Moneda</th>
                        <th className="p-2 w-20">Precio</th>
                        <th className="p-2 w-12 text-center">IVA</th>
                        <th className="p-2 w-16 text-center">Recargo</th>
                        <th className="p-2 w-48 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {catalogoDB.filter(c => c.tipo === 'MAT').map(item => (
                        <tr key={item.codigo}>
                          {editingCode === item.codigo ? (
                            <>
                              <td className="p-1"><input type="text" value={editData.codigo} onChange={(e) => setEditData({ ...editData, codigo: e.target.value })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1"><input type="text" value={editData.desc} onChange={(e) => setEditData({ ...editData, desc: e.target.value })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1"><select value={editData.moneda} onChange={(e) => setEditData({ ...editData, moneda: e.target.value })} className="w-full p-1 border rounded"><option value="UYU">$</option><option value="USD">U$S</option></select></td>
                              <td className="p-1"><input type="number" value={editData.precio} onChange={(e) => setEditData({ ...editData, precio: parseFloat(e.target.value) || 0 })} className="w-full p-1 border rounded" /></td>
                              <td className="p-1 text-center"><input type="checkbox" checked={editData.iva} onChange={(e) => setEditData({ ...editData, iva: e.target.checked })} /></td>
                              <td className="p-1 text-center"><input type="checkbox" checked={editData.recargo} onChange={(e) => setEditData({ ...editData, recargo: e.target.checked })} /></td>
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={guardarEdicionCatalogo} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px]">✔ Guardar</button>
                                  <button onClick={() => setEditingCode(null)} className="bg-slate-400 text-white px-2 py-1 rounded text-[10px]">✕ Cancelar</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 font-bold">{item.codigo}</td>
                              <td className="p-2">{item.desc}</td>
                              <td className="p-2">{item.moneda === 'USD' ? 'U$S' : '$'}</td>
                              <td className="p-2">{parseFloat(item.precio).toFixed(2)}</td>
                              <td className="p-2 text-center">{item.iva ? 'Sí' : 'No'}</td>
                              <td className="p-2 text-center">{item.recargo ? 'Sí' : 'No'}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  <button onClick={() => iniciarEdicionCatalogo(item)} className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1">✏️ Editar</button>
                                  <button onClick={() => eliminarItemCatalogo(item.codigo)} className="bg-slate-500 hover:bg-slate-600 text-white px-2.5 py-1 rounded text-[10px] font-semibold">🗑️ Eliminar</button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    );
  }