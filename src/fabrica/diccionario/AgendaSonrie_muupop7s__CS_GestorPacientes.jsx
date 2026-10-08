import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const AgendaSonrie_muupop7s__CS_GestorPacientes = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const uid = MEITI.obtenerUsuarioActual();
  const tPac = MEITI.obtenerTabla('cs_pacientes');

  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const vacio = { id: '', nombre: '', documento: '', telefono: '', email: '', fecha_nacimiento: '', notas: '' };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatosPropios(`/api/boveda/${tPac}?ecosistema=${eco}`);
    if (res.ok) setPacientes(res.registros);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null); setExito(null);
    if (!form.nombre.trim()) return setError(MEITI.t('name_required', null, 'El nombre es obligatorio.'));

    const payload = { ...form, id: form.id || `pac_${Date.now()}`, usuario_id: uid, fecha_registro: form.fecha_registro || new Date().toISOString() };
    await MEITI.mutar(`/api/boveda/${tPac}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setExito(MEITI.t('saved_success', null, 'Paciente guardado.')); setForm(vacio); cargar(); },
      alFallar: setError
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('delete_patient_q', null, '¿Eliminar este paciente? Se perderá su historial.'))) return;
    await MEITI.mutar(`/api/boveda/${tPac}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: () => { setExito(MEITI.t('deleted_success', null, 'Paciente eliminado.')); cargar(); },
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'nombre', etiqueta: MEITI.t('name', null, 'Nombre') },
    { clave: 'documento', etiqueta: MEITI.t('document', null, 'Documento') },
    { clave: 'telefono', etiqueta: MEITI.t('phone', null, 'Teléfono') },
    { clave: 'email', etiqueta: MEITI.t('email', null, 'Email') }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-serif text-3xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('patients', null, 'Pacientes')}</h2>
      
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <UI.Tarjeta className="p-6 rounded-3xl">
          <h3 className="font-serif text-xl mb-4" style={{ color: tema.texto }}>{form.id ? MEITI.t('edit_patient', null, 'Editar Paciente') : MEITI.t('new_patient', null, 'Nuevo Paciente')}</h3>
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />
          
          <form onSubmit={guardar} className="flex flex-col gap-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('name', null, 'Nombre Completo')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('document', null, 'Documento / DNI')} tipo="text" valor={form.documento} onChange={e => setForm({...form, documento: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('phone', null, 'Teléfono')} tipo="text" valor={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('email', null, 'Email')} tipo="text" valor={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('birthdate', null, 'Fecha de Nacimiento')} tipo="date" valor={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('notes', null, 'Notas Clínicas')} tipo="text" valor={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
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
        {cargando ? <p style={{color: tema.texto}}>{MEITI.t('loading', null, 'Cargando...')}</p> : pacientes.length === 0 ? (
          <UI.EstadoVacio icono="fa-users" mensaje={MEITI.t('no_patients_yet', null, 'No hay pacientes registrados.')} />
        ) : (
          <UI.TablaDatos columnas={columnas} datos={pacientes} claveId="id" onEditar={(f) => { setForm(f); window.scrollTo({top:0, behavior:'smooth'}); }} onBorrar={(f) => borrar(f.id)} />
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default AgendaSonrie_muupop7s__CS_GestorPacientes;
