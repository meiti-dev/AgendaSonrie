/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const tProf = MEITI.obtenerTabla('cs_profesionales');

  const [profesionales, setProfesionales] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const vacio = { id: '', nombre: '', especialidad_id: '', color: '#3b82f6', dias_atencion: 'L-V', hora_inicio: '08:00', hora_fin: '18:00', activo: '1' };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const [resProf, resEsp] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${tProf}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_especialidades')}?ecosistema=${eco}`)
    ]);
    if (resProf.ok) setProfesionales(resProf.registros);
    if (resEsp.ok) setEspecialidades(resEsp.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.nombre.trim()) return setError(MEITI.t('name_required', null, 'El nombre es obligatorio.'));

    const payload = { ...form, id: form.id || `prof_${Date.now()}`, usuario_id: uid };
    await MEITI.mutar(`/api/boveda/${tProf}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setExito(MEITI.t('saved_success', null, 'Profesional guardado.')); setForm(vacio); cargar(); },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_prof_q', null, '¿Eliminar este profesional?'))) return;
    await MEITI.mutar(`/api/boveda/${tProf}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { setExito(MEITI.t('deleted_success', null, 'Profesional eliminado.')); cargar(); },
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'color', etiqueta: '', render: f => <div className="w-6 h-6 rounded-full" style={{ background: f.color }}></div> },
    { clave: 'nombre', etiqueta: MEITI.t('name', null, 'Nombre') },
    { clave: 'especialidad_id', etiqueta: MEITI.t('specialty', null, 'Especialidad'), render: f => especialidades.find(e => e.id === f.especialidad_id)?.nombre || '---' },
    { clave: 'horario', etiqueta: MEITI.t('schedule', null, 'Horario'), render: f => `${f.dias_atencion} (${f.hora_inicio}-${f.hora_fin})` },
    { clave: 'activo', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={String(f.activo) === '1' ? 'exito' : 'neutro'}>{String(f.activo) === '1' ? 'Activo' : 'Inactivo'}</UI.Chip> }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('professionals', null, 'Profesionales')}</h2>
      
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <UI.Tarjeta className="p-6 rounded-3xl">
          <h3 className="font-serif text-xl mb-4" style={{ color: tema.texto }}>{form.id ? MEITI.t('edit_prof', null, 'Editar Profesional') : MEITI.t('new_prof', null, 'Nuevo Profesional')}</h3>
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />
          
          <form onSubmit={guardar} className="flex flex-col gap-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('name', null, 'Nombre Completo')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('specialty', null, 'Especialidad')} tipo="select" valor={form.especialidad_id} onChange={e => setForm({...form, especialidad_id: e.target.value})} opciones={[{value:'', label:'Seleccionar...'}, ...especialidades.map(e => ({value: e.id, label: e.nombre}))]} />
              </div>
              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <UI.Campo etiqueta={MEITI.t('color', null, 'Color Identificatorio')} tipo="text" valor={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="#HEX" />
                </div>
                <div className="flex-1">
                  <UI.Campo etiqueta={MEITI.t('days', null, 'Días de Atención')} tipo="text" valor={form.dias_atencion} onChange={e => setForm({...form, dias_atencion: e.target.value})} placeholder="Ej: L-V" />
                </div>
              </div>
              <div className="flex-1 flex gap-4">
                <div className="flex-1">
                  <UI.Campo etiqueta={MEITI.t('start_time', null, 'Hora Inicio')} tipo="time" valor={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} />
                </div>
                <div className="flex-1">
                  <UI.Campo etiqueta={MEITI.t('end_time', null, 'Hora Fin')} tipo="time" valor={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} />
                </div>
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('status', null, 'Estado')} tipo="select" valor={form.activo} onChange={e => setForm({...form, activo: e.target.value})} opciones={[{value:'1', label:'Activo'}, {value:'0', label:'Inactivo'}]} />
              </div>
            </div>
            <div className="flex gap-3">
              <UI.Boton tipo="submit" variante="primario">{form.id ? MEITI.t('update', null, 'Actualizar') : MEITI.t('save', null, 'Guardar')}</UI.Boton>
              {form.id && <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <UI.Tarjeta className="p-6 rounded-3xl">
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : profesionales.length === 0 ? (
          <UI.EstadoVacio icono="fa-user-doctor" mensaje={MEITI.t('no_professionals_yet', null, 'No hay profesionales registrados.')} />
        ) : (
          <UI.TablaDatos columnas={columnas} datos={profesionales} claveId="id" onEditar={(f) => { setForm(f); window.scrollTo({top:0, behavior:'smooth'}); }} onBorrar={(f) => borrar(f.id)} />
        )}
      </UI.Tarjeta>
    </div>
  );
}