-- SIGUE - migración 02: operaciones anuales, sintaxis de comentarios corregida.
-- Ejecutar solo después de validar la migración 01, permisos y pruebas; no ejecutar todavía en producción.
begin;

create function public.sigue_operar_anio(p_accion text,p_datos jsonb) returns jsonb

language plpgsql security definer set search_path='' as $$

#variable_conflict use_column

declare

  actor text:=public.sigue_actor_anios(); rol text:=public.sigue_rol_anios();

  a public.anios_escolares; destino public.anios_escolares;

  m public.matriculas; e public.evaluaciones_stock; u public.utiles;

  c public.continuidad_estudiantes; d public.detalle_cierre_stock;

  v_id uuid; v_cierre uuid; v_cantidad integer; v_stock integer;

  v_situacion text; v_nivel text; v_grado text; v_estudiante text;

begin

  if actor is null or rol not in ('Administrador','Directora','Secretaria') then raise exception 'Operación no autorizada'; end if;

  if rol not in ('Administrador','Directora') and p_accion not in ('continuidad','matricular','movimiento') then raise exception 'Requiere Administrador'; end if;

  perform pg_advisory_xact_lock(741113);

  if p_accion='crear' then

    insert into public.anios_escolares(anio,fecha_inicio,fecha_fin,observaciones,creado_por)

    values((p_datos->>'anio')::integer,(p_datos->>'fecha_inicio')::date,(p_datos->>'fecha_fin')::date,coalesce(p_datos->>'observaciones',''),actor)

    returning id into v_id;

    return jsonb_build_object('id',v_id);

  end if;



  select * into a from public.anios_escolares where id=(p_datos->>'anio_id')::uuid for update;

  if a.id is null then raise exception 'Año no encontrado'; end if;



  if p_accion='asignar_personal' then

    if a.estado<>'En preparación' then raise exception 'Las asignaciones se preparan antes de la activación'; end if;

    if not exists(select 1 from public.usuarios where id=p_datos->>'usuario_id' and estado='Activo' and rol in ('Profesora','Auxiliar')) then raise exception 'Seleccione una Profesora o Auxiliar activa'; end if;

    insert into public.asignaciones_personal_anuales(anio_id,usuario_id,nivel,grado,responsable)

    values(a.id,p_datos->>'usuario_id',p_datos->>'nivel',p_datos->>'grado',actor)

    on conflict(anio_id,usuario_id) do update set nivel=excluded.nivel,grado=excluded.grado,responsable=actor,actualizado_en=now();

  elsif p_accion='continuidad' then

    if a.estado<>'En preparación' then raise exception 'El destino debe estar en preparación'; end if;

    select * into destino from public.anios_escolares where id=(p_datos->>'origen_id')::uuid;

    if destino.id is null or destino.anio>=a.anio then raise exception 'El origen debe ser un año anterior'; end if;

    v_estudiante:=p_datos->>'estudiante_id';

    select * into m from public.matriculas where anio_id=destino.id and estudiante_id=v_estudiante;

    if m.id is null then raise exception 'Sin matrícula en el origen'; end if;

    if exists(select 1 from public.matriculas where anio_id=a.id and estudiante_id=v_estudiante) then raise exception 'La matrícula ya fue aprobada. Revisión administrativa requerida'; end if;

    v_situacion:=p_datos->>'situacion';

    if v_situacion in ('Continúa y promociona','Continúa en el mismo grado') then

      v_nivel:=p_datos->>'nivel'; v_grado:=p_datos->>'grado';

      if not ((v_nivel='Inicial' and v_grado in ('3 años','4 años','5 años')) or (v_nivel='Primaria' and v_grado in ('1er Grado','2do Grado','3er Grado','4to Grado','5to Grado','6to Grado'))) or v_nivel is null or v_grado is null then raise exception 'Grado o nivel inválido'; end if;

      if v_situacion='Continúa en el mismo grado' and (v_nivel<>m.nivel or v_grado<>m.grado) then raise exception 'La repetición debe conservar el grado de origen'; end if;

    end if;

    insert into public.continuidad_estudiantes(origen_id,destino_id,estudiante_id,situacion,nivel,grado,observaciones,responsable)

    values(destino.id,a.id,v_estudiante,v_situacion,v_nivel,v_grado,coalesce(p_datos->>'observaciones',''),actor)

    on conflict(destino_id,estudiante_id) do update set situacion=excluded.situacion,nivel=excluded.nivel,grado=excluded.grado,observaciones=excluded.observaciones,responsable=actor,actualizado_en=now();

  elsif p_accion='aprobar' then

    if a.estado<>'En preparación' or coalesce((p_datos->>'confirmado')::boolean,false) is not true then raise exception 'Se requiere preparación y confirmación administrativa'; end if;

    -- Sólo decisiones explícitas. Un pendiente nunca genera matrícula.
    insert into public.matriculas(anio_id,estudiante_id,nivel,grado,creado_por)

    select a.id,estudiante_id,nivel,grado,actor from public.continuidad_estudiantes

    where destino_id=a.id and situacion in ('Continúa y promociona','Continúa en el mismo grado')

    on conflict(anio_id,estudiante_id) do nothing;

  elsif p_accion='reabrir_decision' then

    if a.estado<>'En preparación' then raise exception 'El año debe estar en preparación'; end if;

    -- Sólo se retira una matrícula preparatoria sin recepciones. La auditoría conserva la aprobación.
    delete from public.matriculas where anio_id=a.id and estudiante_id=p_datos->>'estudiante_id'

      and exists(select 1 from public.continuidad_estudiantes c where c.destino_id=a.id and c.estudiante_id=p_datos->>'estudiante_id');

  elsif p_accion='matricular' then

    if a.estado='Cerrado' then raise exception 'Año cerrado'; end if;

    v_estudiante:=p_datos->>'estudiante_id';

    if exists(select 1 from public.continuidad_estudiantes where destino_id=a.id and estudiante_id=v_estudiante) then raise exception 'Debe aprobarse desde continuidad'; end if;

    if a.estado='En preparación' and exists(select 1 from public.matriculas m join public.anios_escolares y on y.id=m.anio_id where m.estudiante_id=v_estudiante and y.anio=(select max(anio) from public.anios_escolares where anio<a.anio)) then raise exception 'Registre primero la decisión de continuidad'; end if;

    insert into public.matriculas(anio_id,estudiante_id,nivel,grado,creado_por)

    values(a.id,v_estudiante,p_datos->>'nivel',p_datos->>'grado',actor)

    on conflict(anio_id,estudiante_id) do nothing;

    if a.estado='Activo' then

      update public.estudiantes set nivel=p_datos->>'nivel',grado=p_datos->>'grado',estado='Activo' where id=v_estudiante;

    end if;

  elsif p_accion='copiar_listas' then

    if a.estado<>'En preparación' then raise exception 'El destino debe estar en preparación'; end if;

    select * into destino from public.anios_escolares where id=(p_datos->>'origen_id')::uuid;

    if destino.id is null or destino.anio>=a.anio then raise exception 'Origen inválido'; end if;

    if exists(select 1 from public.listas_utiles where "anioEscolar"::text=destino.anio::text group by nivel,grado having count(*)>1) then raise exception 'Revise las listas duplicadas en el origen antes de copiar'; end if;

    insert into public.listas_utiles(id,"anioEscolar",nivel,grado,items)

    select gen_random_uuid()::text,a.anio::text,l.nivel,l.grado,l.items from public.listas_utiles l

    where l."anioEscolar"::text=destino.anio::text and not exists(

      select 1 from public.listas_utiles n where n."anioEscolar"::text=a.anio::text and n.nivel=l.nivel and n.grado=l.grado);

  elsif p_accion='evaluar' then

    if a.estado<>'Activo' then raise exception 'Sólo se evalúa el inventario del año activo'; end if;

    select * into u from public.utiles where id=p_datos->>'util_id' for update;

    if u.id is null or u."stockActual"<>(p_datos->>'contabilizado')::integer then raise exception 'El stock cambió o no coincide. Revise el inventario físico'; end if;

    insert into public.evaluaciones_stock(anio_id,util_id,contabilizado,bueno,deteriorado,vencido,inutilizable,comprometido,observaciones,evidencia,responsable)

    values(a.id,u.id,(p_datos->>'contabilizado')::integer,(p_datos->>'bueno')::integer,(p_datos->>'deteriorado')::integer,(p_datos->>'vencido')::integer,(p_datos->>'inutilizable')::integer,(p_datos->>'comprometido')::integer,coalesce(p_datos->>'observaciones',''),p_datos->>'evidencia',actor)

    on conflict(anio_id,util_id) do update set contabilizado=excluded.contabilizado,bueno=excluded.bueno,deteriorado=excluded.deteriorado,vencido=excluded.vencido,inutilizable=excluded.inutilizable,comprometido=excluded.comprometido,observaciones=excluded.observaciones,evidencia=excluded.evidencia,responsable=actor,actualizado_en=now();

  elsif p_accion='movimiento' then

    if a.estado<>'Activo' then raise exception 'Se requiere año activo'; end if;

    select * into u from public.utiles where id=p_datos->>'util_id' for update;

    v_cantidad:=(p_datos->>'cantidad')::integer;

    if u.id is null or v_cantidad is null or v_cantidad<=0 or coalesce(p_datos->>'tipo','') not in ('Entrada','Salida') then raise exception 'Movimiento inválido'; end if;

    v_stock:=u."stockActual"+case when p_datos->>'tipo'='Entrada' then v_cantidad else -v_cantidad end;

    if v_stock<0 then raise exception 'Stock insuficiente'; end if;

    insert into public.movimientos(tipo,"utilId","utilNombre",cantidad,fecha,responsable,motivo,"stockAnterior","stockResultante",anio_id)

    values(p_datos->>'tipo',u.id,u.nombre,v_cantidad,now(),actor,p_datos->>'motivo',u."stockActual",v_stock,a.id);

    update public.utiles set "stockActual"=v_stock where id=u.id;

  elsif p_accion='baja' then

    v_id:=(p_datos->>'operacion_id')::uuid;

    if exists(select 1 from public.bajas_inventario where id=v_id) then return jsonb_build_object('repetida',true); end if;

    if a.estado<>'Activo' then raise exception 'La baja requiere un año activo'; end if;

    v_cantidad:=(p_datos->>'cantidad')::integer;

    select * into u from public.utiles where id=p_datos->>'util_id' for update;

    if u.id is null or v_cantidad is null or v_cantidad<=0 or v_cantidad>u."stockActual" then raise exception 'Cantidad inválida o stock insuficiente'; end if;

    insert into public.bajas_inventario(id,anio_id,util_id,cantidad,motivo,observaciones,evidencia,responsable)

    values(v_id,a.id,u.id,v_cantidad,p_datos->>'motivo',p_datos->>'observaciones',p_datos->>'evidencia',actor);

    insert into public.movimientos(tipo,"utilId","utilNombre",cantidad,fecha,responsable,motivo,"stockAnterior","stockResultante",anio_id)

    values('Salida',u.id,u.nombre,v_cantidad,now(),actor,'Baja de inventario · '||(p_datos->>'motivo'),u."stockActual",u."stockActual"-v_cantidad,a.id);

    update public.utiles set "stockActual"=u."stockActual"-v_cantidad where id=u.id;

  elsif p_accion='cerrar' then

    select * into destino from public.anios_escolares where id=(p_datos->>'destino_id')::uuid for update;

    if exists(select 1 from public.cierres_anuales where anio_id=a.id and destino_id=destino.id) then return jsonb_build_object('repetida',true); end if;

    if destino.id is null or a.estado<>'Activo' or destino.estado<>'En preparación' or destino.anio<=a.anio then raise exception 'Seleccione año activo y destino en preparación posterior'; end if;

    if coalesce((p_datos->>'confirmado')::boolean,false) is not true or length(trim(coalesce(p_datos->>'observaciones','')))=0 then raise exception 'Confirme el cierre y documente la revisión física'; end if;

    perform 1 from public.utiles order by id for update;

    if exists(select 1 from public.utiles u left join public.evaluaciones_stock e on e.anio_id=a.id and e.util_id=u.id where e.id is null or e.contabilizado<>u."stockActual" or e.comprometido>0) then raise exception 'Evalúe todos los productos, actualice diferencias y resuelva cantidades comprometidas'; end if;

    if exists(select 1 from public.matriculas m left join public.continuidad_estudiantes c on c.estudiante_id=m.estudiante_id and c.destino_id=destino.id where m.anio_id=a.id and (c.id is null or c.origen_id<>a.id or c.situacion='Pendiente de revisión')) then raise exception 'Hay estudiantes pendientes de continuidad'; end if;

    if exists(select 1 from public.continuidad_estudiantes c left join public.matriculas m on m.anio_id=destino.id and m.estudiante_id=c.estudiante_id where c.destino_id=destino.id and c.situacion in ('Continúa y promociona','Continúa en el mismo grado') and m.id is null) then raise exception 'Falta aprobar las matrículas de continuidad'; end if;

    insert into public.cierres_anuales(anio_id,destino_id,responsable,observaciones) values(a.id,destino.id,actor,p_datos->>'observaciones') returning id into v_cierre;

    insert into public.sigue_operaciones_periodo_internas values(txid_current());

    for e in select * from public.evaluaciones_stock where anio_id=a.id loop

      insert into public.detalle_cierre_stock(cierre_id,util_id,evaluacion,saldo_apertura,deteriorado_pendiente) values(v_cierre,e.util_id,to_jsonb(e),e.bueno,e.deteriorado);

      select * into u from public.utiles where id=e.util_id;

      v_cantidad:=e.contabilizado-e.bueno;

      if v_cantidad>0 then

        insert into public.movimientos(tipo,"utilId","utilNombre",cantidad,fecha,responsable,motivo,"stockAnterior","stockResultante",anio_id)

        values('Salida',u.id,u.nombre,v_cantidad,now(),actor,'Cierre anual · segregación de materiales no aptos',u."stockActual",e.bueno,a.id);

        update public.utiles set "stockActual"=e.bueno where id=u.id;

      end if;

    end loop;

    update public.anios_escolares set estado='Cerrado',cerrado_en=now(),cerrado_por=actor where id=a.id;

    delete from public.sigue_operaciones_periodo_internas where transaccion=txid_current();

  elsif p_accion='activar' then

    if a.estado='Activo' then return jsonb_build_object('repetida',true); end if;

    if a.estado<>'En preparación' or coalesce((p_datos->>'confirmado')::boolean,false) is not true then raise exception 'Requiere año en preparación y confirmación'; end if;

    if exists(select 1 from public.anios_escolares where estado='Activo') then raise exception 'Cierre el año activo antes de activar otro'; end if;

    if exists(select 1 from public.anios_escolares where anio<a.anio) and not exists(select 1 from public.cierres_anuales where destino_id=a.id) then raise exception 'Falta cierre de origen para este destino'; end if;

    if exists(select 1 from public.anios_escolares where anio>a.anio and estado='Cerrado') then raise exception 'No puede activarse un año anterior al histórico cerrado'; end if;

    update public.anios_escolares set estado='Activo' where id=a.id;

    update public.usuarios u set nivel_asignado=p.nivel,aula_asignada=p.grado from public.asignaciones_personal_anuales p where p.anio_id=a.id and p.usuario_id=u.id;

    update public.estudiantes s set nivel=m.nivel,grado=m.grado,estado='Activo' from public.matriculas m where m.anio_id=a.id and m.estudiante_id=s.id;

    update public.estudiantes s set estado='Inactivo' from public.continuidad_estudiantes c where c.destino_id=a.id and c.estudiante_id=s.id and c.situacion in ('Se retira','Se traslada','Egresa');

    -- El saldo de apertura ya existe físicamente. No se agrega una entrada.
  elsif p_accion='reevaluar' then

    if a.estado<>'Activo' then raise exception 'Requiere año activo'; end if;

    select * into d from public.detalle_cierre_stock where id=(p_datos->>'detalle_id')::uuid for update;

    v_cantidad:=(p_datos->>'cantidad')::integer;

    if d.id is null or v_cantidad is null or v_cantidad<=0 or v_cantidad>d.deteriorado_pendiente or length(trim(coalesce(p_datos->>'observaciones','')))=0 then raise exception 'Cantidad o justificación inválida'; end if;
    if not exists (select 1 from public.cierres_anuales ca where ca.id=d.cierre_id and ca.destino_id=a.id) then raise exception 'Esta evaluación no pertenece al año de destino activo'; end if;

    select * into u from public.utiles where id=d.util_id for update;

    update public.detalle_cierre_stock set deteriorado_pendiente=deteriorado_pendiente-v_cantidad where id=d.id;

    -- Evidencia original inmutable. Nueva evaluación documentada en el movimiento y auditoría.
    insert into public.movimientos(tipo,"utilId","utilNombre",cantidad,fecha,responsable,motivo,"stockAnterior","stockResultante",anio_id)

    values('Entrada',u.id,u.nombre,v_cantidad,now(),actor,'Recuperación de deteriorados · '||(p_datos->>'observaciones'),u."stockActual",u."stockActual"+v_cantidad,a.id);

    update public.utiles set "stockActual"=u."stockActual"+v_cantidad where id=u.id;

  else raise exception 'Acción desconocida';

  end if;

  return jsonb_build_object('ok',true);

end $$;

revoke all on function public.sigue_operar_anio(text,jsonb) from public,anon,authenticated;

grant execute on function public.sigue_operar_anio(text,jsonb) to authenticated;

commit;
