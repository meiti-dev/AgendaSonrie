import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const AgendaSonrie_muupop7s__CS_ResumenHoy = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('cs_turnos')}?ecosistema=${eco}`);
      if (res.ok) {
        const hoy = new Date().toISOString().split('T')[0];
        setTurnos(res.registros.filter(t => t.fecha === hoy));
      }
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) return <UI.Tarjeta className="rounded-3xl"><div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto" size={32} color={tema.colorPrimario} /></div></UI.Tarjeta>;

  const completados = turnos.filter(t => t.estado_id === 'est_completado').length;
  const pendientes = turnos.filter(t => t.estado_id === 'est_pendiente' || t.estado_id === 'est_confirmado').length;
  const cancelados = turnos.filter(t => t.estado_id === 'est_cancelado').length;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('today_summary', null, 'Resumen de Hoy')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3 opacity-70" style={{ color: tema.texto }}>
            <Iconos.CalendarDays size={20} />
            <span className="font-bold uppercase text-xs tracking-wider">{MEITI.t('total_appointments', null, 'Total Turnos')}</span>
          </div>
          <span className="text-4xl font-black" style={{ color: tema.colorPrimario }}>{turnos.length}</span>
        </UI.Tarjeta>
        <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3 opacity-70" style={{ color: tema.texto }}>
            <Iconos.Clock size={20} />
            <span className="font-bold uppercase text-xs tracking-wider">{MEITI.t('pending', null, 'Pendientes')}</span>
          </div>
          <span className="text-4xl font-black" style={{ color: tema.colorSecundario }}>{pendientes}</span>
        </UI.Tarjeta>
        <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3 opacity-70" style={{ color: tema.texto }}>
            <Iconos.CheckCircle size={20} />
            <span className="font-bold uppercase text-xs tracking-wider">{MEITI.t('completed', null, 'Completados')}</span>
          </div>
          <span className="text-4xl font-black text-emerald-600">{completados}</span>
        </UI.Tarjeta>
        <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3 opacity-70" style={{ color: tema.texto }}>
            <Iconos.X size={20} />
            <span className="font-bold uppercase text-xs tracking-wider">{MEITI.t('cancelled', null, 'Cancelados')}</span>
          </div>
          <span className="text-4xl font-black text-rose-500">{cancelados}</span>
        </UI.Tarjeta>
      </div>
    </div>
  );
};

export default AgendaSonrie_muupop7s__CS_ResumenHoy;
