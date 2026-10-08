import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const AgendaSonrie_muupop7s__CS_PanelRecordatorios = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().split('T')[0];

  const [fecha, setFecha] = useState(mananaStr);
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [formEstado, setFormEstado] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [resTurnos, resPacientes, resEstados] = await Promise.all([
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`),
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_pacientes')}?ecosistema=${eco}`),
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_estados_turno')}?ecosistema=${eco}`)
      ]);

      if (!resTurnos.ok || !resPacientes.ok || !resEstados.ok) {
        setError(MEITI.t('err_load_data', null, 'Error al cargar los datos.'));
      } else {
        setTurnos(resTurnos.registros || []);
        setPacientes(resPacientes.registros || []);
        setEstados(resEstados.registros || []);
      }
    } catch (err) {
      setError(MEITI.t('err_conn', null, 'Error de conexión.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const turnosDelDia = turnos
    .filter(t => t.fecha === fecha)
    .map(t => {
      const pac = pacientes.find(p => p.id === t.paciente_id) || {};
      const est = estados.find(e => e.id === t.estado_id) || {};
      return {
        ...t,
        paciente_nombre: pac.nombre || MEITI.t('unknown_patient', null, 'Paciente Desconocido'),
        paciente_telefono: pac.telefono || '',
        estado_nombre: est.nombre || MEITI.t('no_status', null, 'Sin Estado'),
        estado_color: est.color || 'neutro'
      };
    })
    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));

  const alternarRecordatorio = async (fila) => {
    const nuevoValor = fila.recordatorio_enviado ? 0 : 1;
    const payload = { ...fila, recordatorio_enviado: nuevoValor };
    
    delete payload.paciente_nombre;
    delete payload.paciente_telefono;
    delete payload.estado_nombre;
    delete payload.estado_color;

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('reminder_updated', null, 'Estado de recordatorio actualizado.'));
        cargarDatos();
        setTimeout(() => setExito(null), 3000);
      },
      alFallar: (err) => setError(err || MEITI.t('err_update', null, 'Error al actualizar.'))
    });
  };

  const contactarWhatsApp = (telefono) => {
    if (!telefono) {
      setError(MEITI.t('err_no_phone', null, 'El paciente no tiene teléfono registrado.'));
      return;
    }
    const numLimpio = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${numLimpio}`, '_blank');
  };

  const abrirEdicionEstado = (fila) => {
    setTurnoEditando(fila);
    setFormEstado(fila.estado_id || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarEstado = async () => {
    if (!turnoEditando) return;
    const payload = { ...turnoEditando, estado_id: formEstado };
    
    delete payload.paciente_nombre;
    delete payload.paciente_telefono;
    delete payload.estado_nombre;
    delete payload.estado_color;

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('status_updated', null, 'Estado del turno actualizado.'));
        setTurnoEditando(null);
        cargarDatos();
        setTimeout(() => setExito(null), 3000);
      },
      alFallar: (err) => setError(err || MEITI.t('err_update', null, 'Error al actualizar.'))
    });
  };

  const borrarTurno = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('confirm_delete_appt', null, '¿Cancelar y borrar este turno?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: () => {
        setExito(MEITI.t('appt_deleted', null, 'Turno eliminado.'));
        cargarDatos();
        setTimeout(() => setExito(null), 3000);
      },
      alFallar: (err) => setError(err || MEITI.t('err_delete', null, 'Error al eliminar.'))
    });
  };

  const columnas = [
    { clave: 'hora_inicio', etiqueta: MEITI.t('col_time', null, 'Hora') },
    { clave: 'paciente_nombre', etiqueta: MEITI.t('col_patient', null, 'Paciente'), render: (f) => <span className="font-bold">{f.paciente_nombre}</span> },
    { clave: 'paciente_telefono', etiqueta: MEITI.t('col_phone', null, 'Teléfono') },
    { clave: 'estado_nombre', etiqueta: MEITI.t('col_status', null, 'Estado'), render: (f) => <UI.Chip tono="neutro">{f.estado_nombre}</UI.Chip> },
    { clave: 'recordatorio_enviado', etiqueta: MEITI.t('col_reminder', null, 'Avisado'), render: (f) => <UI.Chip tono={f.recordatorio_enviado ? 'exito' : 'alerta'}>{f.recordatorio_enviado ? MEITI.t('yes', null, 'Sí') : MEITI.t('no', null, 'No')}</UI.Chip> }
  ];

  const accionesExtra = [
    {
      etiqueta: MEITI.t('action_whatsapp', null, 'WhatsApp'),
      icono: 'fa-whatsapp',
      tono: 'exito',
      onClick: (f) => contactarWhatsApp(f.paciente_telefono)
    },
    {
      etiqueta: (f) => f.recordatorio_enviado ? MEITI.t('action_unmark_rem', null, 'Desmarcar Aviso') : MEITI.t('action_mark_rem', null, 'Marcar Avisado'),
      icono: 'fa-bell',
      tono: 'primario',
      onClick: (f) => alternarRecordatorio(f)
    }
  ];

  const totalTurnos = turnosDelDia.length;
  const totalAvisados = turnosDelDia.filter(t => t.recordatorio_enviado).length;
  const totalPendientes = totalTurnos - totalAvisados;

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <Animacion.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-w-0">
        <UI.Tarjeta className="flex flex-col md:flex-row items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-xl flex-shrink-0" style={{ background: tema.colorPrimario + '22', color: tema.colorPrimario }}>
              <Iconos.BellRing size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate" style={{ color: tema.texto }}>{MEITI.t('reminders_title', null, 'Gestión de Recordatorios')}</h2>
              <p className="text-sm opacity-70 truncate" style={{ color: tema.texto }}>{MEITI.t('reminders_subtitle', null, 'Confirma la asistencia de los próximos turnos')}</p>
            </div>
          </div>
          <div className="w-full md:w-64 flex-shrink-0">
            <UI.SelectorFecha 
              valor={fecha} 
              onCambio={(e) => setFecha(e.target.value)} 
              placeholder={MEITI.t('select_date', null, 'Seleccionar fecha')} 
            />
          </div>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <Animacion.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="min-w-0">
          <UI.Tarjeta className="flex items-center gap-4 min-w-0">
            <div className="p-4 rounded-full bg-black/5 flex-shrink-0">
              <Iconos.CalendarDays size={24} color={tema.texto} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-70 uppercase truncate" style={{ color: tema.texto }}>{MEITI.t('kpi_total_appts', null, 'Turnos del Día')}</p>
              <p className="text-3xl font-black truncate" style={{ color: tema.texto }}>{totalTurnos}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
        
        <Animacion.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="min-w-0">
          <UI.Tarjeta className="flex items-center gap-4 min-w-0">
            <div className="p-4 rounded-full flex-shrink-0" style={{ background: '#f59e0b22' }}>
              <Iconos.Clock size={24} color="#f59e0b" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-70 uppercase truncate" style={{ color: tema.texto }}>{MEITI.t('kpi_pending_rem', null, 'Por Avisar')}</p>
              <p className="text-3xl font-black truncate" style={{ color: tema.texto }}>{totalPendientes}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>

        <Animacion.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.3 }} className="min-w-0">
          <UI.Tarjeta className="flex items-center gap-4 min-w-0">
            <div className="p-4 rounded-full flex-shrink-0" style={{ background: '#10b98122' }}>
              <Iconos.CheckCheck size={24} color="#10b981" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-70 uppercase truncate" style={{ color: tema.texto }}>{MEITI.t('kpi_notified', null, 'Avisados')}</p>
              <p className="text-3xl font-black truncate" style={{ color: tema.texto }}>{totalAvisados}</p>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
      </div>

      <Animacion.AnimatePresence>
        {turnoEditando && (
          <Animacion.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden min-w-0">
            <UI.Tarjeta className="flex flex-col gap-4 border-2 min-w-0" style={{ borderColor: tema.colorPrimario }}>
              <div className="flex items-center gap-2 min-w-0">
                <Iconos.Pencil size={18} color={tema.colorPrimario} className="flex-shrink-0" />
                <UI.Etiqueta>{MEITI.t('edit_status_title', null, 'Actualizar Estado del Turno')}</UI.Etiqueta>
              </div>
              <p className="text-sm truncate" style={{ color: tema.texto }}>
                {MEITI.t('editing_appt_for', { nombre: turnoEditando.paciente_nombre }, 'Turno de {nombre} a las ')} {turnoEditando.hora_inicio}
              </p>
              <div className="flex flex-col md:flex-row gap-4 items-end min-w-0">
                <div className="flex-1 w-full min-w-0">
                  <UI.Campo 
                    etiqueta={MEITI.t('f_status', null, 'Nuevo Estado')}
                    tipo="select"
                    valor={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    opciones={estados.map(e => ({ value: e.id, label: e.nombre }))}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                  <UI.Boton onClick={guardarEstado} variante="primario">{MEITI.t('btn_save', null, 'Guardar')}</UI.Boton>
                  <UI.Boton onClick={() => setTurnoEditando(null)} variante="secundario">{MEITI.t('btn_cancel', null, 'Cancelar')}</UI.Boton>
                </div>
              </div>
            </UI.Tarjeta>
          </Animacion.motion.div>
        )}
      </Animacion.AnimatePresence>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="min-w-0">
        <UI.Tarjeta className="flex flex-col gap-4 min-w-0">
          <UI.Etiqueta>{MEITI.t('appts_list_title', null, 'Lista de Turnos')}</UI.Etiqueta>
          
          {cargando ? (
            <div className="p-8 text-center min-w-0">
              <Iconos.LoaderCircle size={32} className="animate-spin mx-auto mb-2" style={{ color: tema.colorPrimario }} />
              <p style={{ color: tema.texto }}>{MEITI.t('loading', null, 'Cargando turnos...')}</p>
            </div>
          ) : turnosDelDia.length === 0 ? (
            <UI.EstadoVacio 
              icono="fa-calendar-check" 
              mensaje={MEITI.t('no_appts_date', null, 'No hay turnos registrados para esta fecha.')} 
            />
          ) : (
            <UI.TablaDatos 
              columnas={columnas}
              datos={turnosDelDia}
              claveId="id"
              onEditar={abrirEdicionEstado}
              onBorrar={(f) => borrarTurno(f.id)}
              accionesExtra={accionesExtra}
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default AgendaSonrie_muupop7s__CS_PanelRecordatorios;
