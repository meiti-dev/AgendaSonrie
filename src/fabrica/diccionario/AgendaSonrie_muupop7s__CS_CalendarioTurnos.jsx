import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const AgendaSonrie_muupop7s__CS_CalendarioTurnos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turnos, setTurnos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const [resTurnos, resProf, resPac] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_profesionales')}?ecosistema=${eco}`),
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_pacientes')}?ecosistema=${eco}`)
    ]);
    
    if (resTurnos.ok) setTurnos(resTurnos.registros);
    if (resProf.ok) setProfesionales(resProf.registros.filter(p => String(p.activo) === '1'));
    if (resPac.ok) setPacientes(resPac.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const turnosDelDia = turnos.filter(t => t.fecha === fecha).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('daily_calendar', null, 'Agenda Diaria')}</h2>
        <div className="w-full md:w-64">
          <UI.SelectorFecha valor={fecha} onCambio={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      {cargando ? (
        <UI.Tarjeta className="rounded-3xl"><div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto" size={32} color={tema.colorPrimario} /></div></UI.Tarjeta>
      ) : profesionales.length === 0 ? (
        <UI.EstadoVacio icono="fa-user-doctor" mensaje={MEITI.t('no_professionals', null, 'No hay profesionales configurados.')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {profesionales.map(prof => {
            const turnosProf = turnosDelDia.filter(t => t.profesional_id === prof.id);
            return (
              <UI.Tarjeta key={prof.id} className="p-6 rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: tema.texto + '1A' }}>
                  <div className="w-4 h-10 rounded-full" style={{ background: prof.color || tema.colorPrimario }}></div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight" style={{ color: tema.texto }}>{prof.nombre}</h4>
                    <span className="text-xs opacity-70" style={{ color: tema.texto }}>{prof.hora_inicio} - {prof.hora_fin}</span>
                  </div>
                </div>

                {turnosProf.length === 0 ? (
                  <p className="text-sm opacity-60 italic py-8 text-center" style={{ color: tema.texto }}>{MEITI.t('free_schedule', null, 'Agenda libre para este día.')}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {turnosProf.map(turno => {
                      const pac = pacientes.find(p => p.id === turno.paciente_id) || { nombre: 'Desconocido' };
                      return (
                        <div key={turno.id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: tema.fondo, border: `1px solid ${tema.texto}1A` }}>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm" style={{ color: tema.colorPrimario }}>{turno.hora_inicio}</span>
                            <span className="font-semibold text-sm mt-1" style={{ color: tema.texto }}>{pac.nombre}</span>
                          </div>
                          <UI.Chip tono={turno.estado_id === 'est_completado' ? 'exito' : turno.estado_id === 'est_cancelado' ? 'peligro' : 'alerta'}>
                            {turno.estado_id.replace('est_', '')}
                          </UI.Chip>
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
};

export default AgendaSonrie_muupop7s__CS_CalendarioTurnos;
