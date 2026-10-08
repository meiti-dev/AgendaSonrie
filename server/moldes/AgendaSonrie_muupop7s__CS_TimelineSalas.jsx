/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [turnos, setTurnos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const [resTurnos, resSalas, resProf, resPac] = await Promise.all([
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`),
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_salas')}?ecosistema=${eco}`),
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_profesionales')}?ecosistema=${eco}`),
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_pacientes')}?ecosistema=${eco}`)
      ]);
      
      if (resTurnos.ok) {
        const hoy = new Date().toISOString().split('T')[0];
        setTurnos(resTurnos.registros.filter(t => t.fecha === hoy).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));
      }
      if (resSalas.ok) setSalas(resSalas.registros.filter(s => String(s.activa) === '1'));
      if (resProf.ok) setProfesionales(resProf.registros);
      if (resPac.ok) setPacientes(resPac.registros);
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) return null;

  return (
    <div className="flex flex-col gap-8 mt-4">
      <h3 className="font-serif text-2xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('rooms_timeline', null, 'Actividad por Sala')}</h3>
      {salas.length === 0 ? (
        <UI.EstadoVacio icono="fa-door-open" mensaje={MEITI.t('no_rooms', null, 'No hay salas configuradas.')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {salas.map(sala => {
            const turnosSala = turnos.filter(t => t.sala_id === sala.id);
            return (
              <UI.Tarjeta key={sala.id} className="p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: tema.texto + '1A' }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: tema.colorPrimario + '1A', color: tema.colorPrimario }}>
                    <Iconos.DoorOpen size={20} />
                  </div>
                  <h4 className="font-bold text-lg" style={{ color: tema.texto }}>{sala.nombre}</h4>
                </div>
                
                {turnosSala.length === 0 ? (
                  <p className="text-sm opacity-60 italic py-4 text-center" style={{ color: tema.texto }}>{MEITI.t('no_appointments_room', null, 'Sin turnos asignados hoy.')}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {turnosSala.map(turno => {
                      const pac = pacientes.find(p => p.id === turno.paciente_id) || { nombre: 'Desconocido' };
                      const prof = profesionales.find(p => p.id === turno.profesional_id) || { nombre: 'Desconocido', color: tema.colorSecundario };
                      return (
                        <div key={turno.id} className="flex flex-col p-3 rounded-2xl border-l-4" style={{ background: tema.fondo, borderColor: prof.color || tema.colorSecundario }}>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm" style={{ color: tema.texto }}>{turno.hora_inicio} - {turno.hora_fin}</span>
                            <UI.Chip tono={turno.estado_id === 'est_completado' ? 'exito' : turno.estado_id === 'est_cancelado' ? 'peligro' : 'alerta'}>
                              {turno.estado_id.replace('est_', '')}
                            </UI.Chip>
                          </div>
                          <span className="font-bold mt-1" style={{ color: tema.texto }}>{pac.nombre}</span>
                          <span className="text-xs opacity-70 flex items-center gap-1 mt-1" style={{ color: tema.texto }}>
                            <Iconos.User size={12} /> {prof.nombre}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </UI.Tarjeta>
            );
          })}
        </div>
      )}
    </div>
  );
}