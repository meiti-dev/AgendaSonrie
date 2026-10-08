/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const tTurnos = MEITI.obtenerTabla('cs_turnos');

  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [salas, setSalas] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const vacio = { id: '', paciente_id: '', profesional_id: '', sala_id: '', tratamiento_id: '', fecha: '', hora_inicio: '', hora_fin: '', estado_id: 'est_pendiente', notas: '' };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const [resTur, resPac, resProf, resSal, resTrat, resEst] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${tTurnos}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_pacientes')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_profesionales')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_salas')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_tratamientos')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_estados_turno')}?ecosistema=${eco}`)
    ]);

    if (resTur.ok) setTurnos(resTur.registros);
    if (resPac.ok) setPacientes(resPac.registros);
    if (resProf.ok) setProfesionales(resProf.registros);
    if (resSal.ok) setSalas(resSal.registros);
    if (resTrat.ok) setTratamientos(resTrat.registros);
    if (resEst.ok) setEstados(resEst.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);

    if (!form.paciente_id || !form.profesional_id || !form.sala_id || !form.fecha || !form.hora_inicio || !form.hora_fin) {
      return setError(MEITI.t('missing_fields', null, 'Completa todos los campos obligatorios.'));
    }

    if (form.hora_inicio >= form.hora_fin) {
      return setError(MEITI.t('invalid_time', null, 'La hora de inicio debe ser menor a la hora de fin.'));
    }

    const superpuesto = turnos.some(t => 
      t.id !== form.id && 
      t.fecha === form.fecha && 
      t.estado_id !== 'est_cancelado' &&
      (t.sala_id === form.sala_id || t.profesional_id === form.profesional_id) &&
      ((form.hora_inicio >= t.hora_inicio && form.hora_inicio < t.hora_fin) || 
       (form.hora_fin > t.hora_inicio && form.hora_fin <= t.hora_fin) || 
       (form.hora_inicio <= t.hora_inicio && form.hora_fin >= t.hora_fin))
    );

    if (superpuesto) {
      return setError(MEITI.t('overlap_error', null, 'Existe superposición de horario para el profesional o la sala seleccionada.'));
    }

    const payload = { ...form, id: form.id || `tur_${Date.now()}`, usuario_id: uid };
    
    await MEITI.mutar(`/api/boveda/${tTurnos}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('saved_success', null, 'Turno guardado correctamente.'));
        setForm(vacio);
        cargar();
      },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_appointment_q', null, '¿Cancelar y eliminar este turno?'))) return;
    await MEITI.mutar(`/api/boveda/${tTurnos}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { setExito(MEITI.t('deleted_success', null, 'Turno eliminado.')); cargar(); },
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'fecha', etiqueta: MEITI.t('date', null, 'Fecha'), tipo: 'fecha' },
    { clave: 'hora_inicio', etiqueta: MEITI.t('time', null, 'Hora'), render: f => `${f.hora_inicio} - ${f.hora_fin}` },
    { clave: 'paciente_id', etiqueta: MEITI.t('patient', null, 'Paciente'), render: f => pacientes.find(p => p.id === f.paciente_id)?.nombre || '---' },
    { clave: 'profesional_id', etiqueta: MEITI.t('professional', null, 'Profesional'), render: f => profesionales.find(p => p.id === f.profesional_id)?.nombre || '---' },
    { clave: 'estado_id', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={f.estado_id === 'est_completado' ? 'exito' : 'neutro'}>{estados.find(e => e.id === f.estado_id)?.nombre || f.estado_id}</UI.Chip> }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('appointment_management', null, 'Gestión de Turnos')}</h2>
      
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <UI.Tarjeta className="p-6 rounded-3xl">
          <h3 className="font-serif text-xl mb-4" style={{ color: tema.texto }}>{form.id ? MEITI.t('edit_appointment', null, 'Editar Turno') : MEITI.t('new_appointment', null, 'Agendar Nuevo Turno')}</h3>
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />
          
          <form onSubmit={guardar} className="flex flex-col gap-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('patient', null, 'Paciente')} tipo="select" valor={form.paciente_id} onChange={e => setForm({...form, paciente_id: e.target.value})} opciones={[{value:'', label: 'Seleccionar...'}, ...pacientes.map(p => ({value: p.id, label: p.nombre}))]} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('professional', null, 'Profesional')} tipo="select" valor={form.profesional_id} onChange={e => setForm({...form, profesional_id: e.target.value})} opciones={[{value:'', label: 'Seleccionar...'}, ...profesionales.map(p => ({value: p.id, label: p.nombre}))]} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('room', null, 'Sala')} tipo="select" valor={form.sala_id} onChange={e => setForm({...form, sala_id: e.target.value})} opciones={[{value:'', label: 'Seleccionar...'}, ...salas.map(s => ({value: s.id, label: s.nombre}))]} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('treatment', null, 'Tratamiento')} tipo="select" valor={form.tratamiento_id} onChange={e => setForm({...form, tratamiento_id: e.target.value})} opciones={[{value:'', label: 'Seleccionar...'}, ...tratamientos.map(t => ({value: t.id, label: t.nombre}))]} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('date', null, 'Fecha')} tipo="date" valor={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
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
                <UI.Campo etiqueta={MEITI.t('status', null, 'Estado')} tipo="select" valor={form.estado_id} onChange={e => setForm({...form, estado_id: e.target.value})} opciones={estados.map(e => ({value: e.id, label: e.nombre}))} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('notes', null, 'Notas')} tipo="text" valor={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <UI.Boton tipo="submit" variante="primario">{form.id ? MEITI.t('update', null, 'Actualizar') : MEITI.t('save', null, 'Guardar Turno')}</UI.Boton>
              {form.id && <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton>}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <UI.Tarjeta className="p-6 rounded-3xl">
        <h3 className="font-serif text-xl mb-4" style={{ color: tema.texto }}>{MEITI.t('appointments_list', null, 'Listado de Turnos')}</h3>
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : turnos.length === 0 ? (
          <UI.EstadoVacio icono="fa-calendar-xmark" mensaje={MEITI.t('no_appointments', null, 'No hay turnos registrados.')} />
        ) : (
          <UI.TablaDatos columnas={columnas} datos={turnos} claveId="id" onEditar={(f) => { setForm(f); window.scrollTo({top:0, behavior:'smooth'}); }} onBorrar={(f) => borrar(f.id)} />
        )}
      </UI.Tarjeta>
    </div>
  );
}