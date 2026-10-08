/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();

  const [pestana, setPestana] = useState('cs_salas');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState({});

  const configTabs = {
    cs_salas: {
      titulo: MEITI.t('tab_rooms', null, 'Salas'),
      icono: 'fa-door-open',
      vacio: { id: '', nombre: '', descripcion: '', activa: '1' },
      columnas: [
        { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
        { clave: 'descripcion', etiqueta: MEITI.t('col_desc', null, 'Descripción') },
        { clave: 'activa', etiqueta: MEITI.t('col_status', null, 'Estado'), render: f => <UI.Chip tono={String(f.activa) === '1' ? 'exito' : 'neutro'}>{String(f.activa) === '1' ? MEITI.t('active', null, 'Activa') : MEITI.t('inactive', null, 'Inactiva')}</UI.Chip> }
      ]
    },
    cs_tratamientos: {
      titulo: MEITI.t('tab_treatments', null, 'Tratamientos'),
      icono: 'fa-tooth',
      vacio: { id: '', nombre: '', duracion_minutos: '', precio_estimado: '', activo: '1' },
      columnas: [
        { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
        { clave: 'duracion_minutos', etiqueta: MEITI.t('col_duration', null, 'Duración (min)'), tipo: 'numero' },
        { clave: 'precio_estimado', etiqueta: MEITI.t('col_price', null, 'Precio Est.'), tipo: 'moneda' },
        { clave: 'activo', etiqueta: MEITI.t('col_status', null, 'Estado'), render: f => <UI.Chip tono={String(f.activo) === '1' ? 'exito' : 'neutro'}>{String(f.activo) === '1' ? MEITI.t('active', null, 'Activo') : MEITI.t('inactive', null, 'Inactivo')}</UI.Chip> }
      ]
    },
    cs_especialidades: {
      titulo: MEITI.t('tab_specialties', null, 'Especialidades'),
      icono: 'fa-user-doctor',
      vacio: { id: '', nombre: '', descripcion: '' },
      columnas: [
        { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
        { clave: 'descripcion', etiqueta: MEITI.t('col_desc', null, 'Descripción') }
      ]
    },
    cs_estados_turno: {
      titulo: MEITI.t('tab_statuses', null, 'Estados'),
      icono: 'fa-bars-progress',
      vacio: { id: '', nombre: '', color: 'neutro', orden: '0' },
      columnas: [
        { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
        { clave: 'color', etiqueta: MEITI.t('col_color', null, 'Color'), render: f => <UI.Chip tono={f.color || 'neutro'}>{f.color || 'neutro'}</UI.Chip> },
        { clave: 'orden', etiqueta: MEITI.t('col_order', null, 'Orden'), tipo: 'numero' }
      ]
    }
  };

  const cargarDatos = async (tablaActiva) => {
    setCargando(true);
    setError(null);
    const url = `/api/boveda/${MEITI.obtenerTabla(tablaActiva)}?ecosistema=${eco}`;
    const res = await MEITI.fetchDatosPropios(url);
    if (res.ok) {
      let data = res.registros || [];
      if (tablaActiva === 'cs_estados_turno') data.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      setRegistros(data);
    } else {
      setError(res.error || MEITI.t('err_load', null, 'Error al cargar los datos.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    setForm(configTabs[pestana].vacio);
    cargarDatos(pestana);
  }, [pestana]);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!form.nombre || !form.nombre.trim()) {
      return setError(MEITI.t('err_name_req', null, 'El nombre es obligatorio.'));
    }

    setGuardando(true);
    const esNuevo = !form.id;
    const payload = { ...form, usuario_id: miId };
    if (esNuevo) payload.id = `${pestana}_${Date.now()}`;

    if (pestana === 'cs_tratamientos') {
      payload.duracion_minutos = Number(payload.duracion_minutos) || 0;
      payload.precio_estimado = Number(payload.precio_estimado) || 0;
      payload.activo = Number(payload.activo) || 0;
    }
    if (pestana === 'cs_salas') {
      payload.activa = Number(payload.activa) || 0;
    }
    if (pestana === 'cs_estados_turno') {
      payload.orden = Number(payload.orden) || 0;
    }

    const url = `/api/boveda/${MEITI.obtenerTabla(pestana)}?ecosistema=${eco}`;
    await MEITI.mutar(url, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('success_save', null, 'Registro guardado correctamente.'));
        setForm(configTabs[pestana].vacio);
        cargarDatos(pestana);
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save', null, 'Error al guardar.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('confirm_delete', null, '¿Borrar este registro?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    setError(null);
    setExito(null);

    const url = `/api/boveda/${MEITI.obtenerTabla(pestana)}?ecosistema=${eco}&id=${id}`;
    await MEITI.mutar(url, { method: 'DELETE' }, {
      alLograr: () => {
        setExito(MEITI.t('success_delete', null, 'Registro eliminado.'));
        if (form.id === id) setForm(configTabs[pestana].vacio);
        cargarDatos(pestana);
      },
      alFallar: (err) => setError(err || MEITI.t('err_delete', null, 'Error al eliminar.'))
    });
  };

  const editar = (fila) => {
    const editForm = { ...fila };
    if (pestana === 'cs_tratamientos') {
      editForm.activo = String(fila.activo ?? 1);
    }
    if (pestana === 'cs_salas') {
      editForm.activa = String(fila.activa ?? 1);
    }
    setForm(editForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderFormulario = () => {
    return (
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1">
            <UI.Campo 
              etiqueta={MEITI.t('f_name', null, 'Nombre')}
              tipo="text"
              valor={form.nombre || ''}
              onChange={e => setForm({...form, nombre: e.target.value})}
            />
          </div>

          {pestana === 'cs_salas' && (
            <>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_status', null, 'Estado')}
                  tipo="select"
                  valor={form.activa || '1'}
                  onChange={e => setForm({...form, activa: e.target.value})}
                  opciones={[{value: '1', label: MEITI.t('active', null, 'Activa')}, {value: '0', label: MEITI.t('inactive', null, 'Inactiva')}]}
                />
              </div>
              <div className="md:col-span-2 flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_desc', null, 'Descripción')}
                  tipo="textarea"
                  valor={form.descripcion || ''}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                />
              </div>
            </>
          )}

          {pestana === 'cs_tratamientos' && (
            <>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_duration', null, 'Duración (minutos)')}
                  tipo="number"
                  valor={form.duracion_minutos || ''}
                  onChange={e => setForm({...form, duracion_minutos: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_price', null, 'Precio Estimado')}
                  tipo="number"
                  valor={form.precio_estimado || ''}
                  onChange={e => setForm({...form, precio_estimado: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_status', null, 'Estado')}
                  tipo="select"
                  valor={form.activo || '1'}
                  onChange={e => setForm({...form, activo: e.target.value})}
                  opciones={[{value: '1', label: MEITI.t('active', null, 'Activo')}, {value: '0', label: MEITI.t('inactive', null, 'Inactivo')}]}
                />
              </div>
            </>
          )}

          {pestana === 'cs_especialidades' && (
            <div className="md:col-span-2 flex-1">
              <UI.Campo 
                etiqueta={MEITI.t('f_desc', null, 'Descripción')}
                tipo="textarea"
                valor={form.descripcion || ''}
                onChange={e => setForm({...form, descripcion: e.target.value})}
              />
            </div>
          )}

          {pestana === 'cs_estados_turno' && (
            <>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_color', null, 'Color Visual')}
                  tipo="select"
                  valor={form.color || 'neutro'}
                  onChange={e => setForm({...form, color: e.target.value})}
                  opciones={[
                    {value: 'neutro', label: MEITI.t('color_neutral', null, 'Neutro (Gris)')},
                    {value: 'primario', label: MEITI.t('color_primary', null, 'Primario (Tema)')},
                    {value: 'secundario', label: MEITI.t('color_secondary', null, 'Secundario (Tema)')},
                    {value: 'exito', label: MEITI.t('color_success', null, 'Éxito (Verde)')},
                    {value: 'alerta', label: MEITI.t('color_warning', null, 'Alerta (Amarillo)')},
                    {value: 'peligro', label: MEITI.t('color_danger', null, 'Peligro (Rojo)')}
                  ]}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('f_order', null, 'Orden de aparición')}
                  tipo="number"
                  valor={form.orden || ''}
                  onChange={e => setForm({...form, orden: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
            <span className="flex items-center gap-2">
              <Iconos.Save size={16} /> 
              {guardando ? MEITI.t('saving', null, 'Guardando...') : (form.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_create', null, 'Crear Registro'))}
            </span>
          </UI.Boton>
          {form.id && (
            <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(configTabs[pestana].vacio)}>
              <span className="flex items-center gap-2">
                <Iconos.X size={16} /> 
                {MEITI.t('btn_cancel', null, 'Cancelar')}
              </span>
            </UI.Boton>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <UI.Pestanas 
        pestanas={Object.keys(configTabs).map(k => ({ id: k, titulo: configTabs[k].titulo, icono: configTabs[k].icono }))}
        activa={pestana}
        onCambio={setPestana}
      />

      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <Animacion.motion.div 
        key={`form-${pestana}`} 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Iconos.PencilLine size={20} color={tema.colorPrimario} />
            <UI.Etiqueta>{form.id ? MEITI.t('edit_record', null, 'Editar Registro') : MEITI.t('new_record', null, 'Nuevo Registro')}</UI.Etiqueta>
          </div>
          {renderFormulario()}
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div 
        key={`list-${pestana}`} 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Iconos.List size={20} color={tema.colorSecundario} />
            <UI.Etiqueta>{configTabs[pestana].titulo}</UI.Etiqueta>
          </div>
          
          {cargando ? (
            <div className="p-8 text-center">
              <Iconos.LoaderCircle size={32} className="animate-spin mx-auto mb-2" style={{ color: tema.colorPrimario }} />
              <p style={{ color: tema.texto }}>{MEITI.t('loading', null, 'Cargando datos...')}</p>
            </div>
          ) : registros.length === 0 ? (
            <UI.EstadoVacio 
              icono={configTabs[pestana].icono} 
              mensaje={MEITI.t('empty_catalog', null, 'Todavía no hay registros en este catálogo.')} 
            />
          ) : (
            <UI.TablaDatos 
              columnas={configTabs[pestana].columnas}
              datos={registros}
              claveId="id"
              onEditar={editar}
              onBorrar={(fila) => borrar(fila.id)}
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
}