begin;

-- Validar contra la matrícula histórica, no contra el grado actual.
-- Mantener la verificación anterior para recepciones sin período.
create or replace function public.validar_asignacion_recepcion()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_nivel text;
  v_grado text;
  v_estudiante text;
begin
  if new.anio_id is not null then
    if new.matricula_id is null then
      raise exception 'La recepción anual requiere matrícula';
    end if;

    select m.nivel, m.grado, m.estudiante_id
      into v_nivel, v_grado, v_estudiante
    from public.matriculas m
    where m.id = new.matricula_id and m.anio_id = new.anio_id;

    if not found or v_estudiante is distinct from new."estudianteId" then
      raise exception 'La matrícula no corresponde a esta recepción';
    end if;
  else
    select e.nivel, e.grado
      into v_nivel, v_grado
    from public.estudiantes e
    where e.id = new."estudianteId";

    if not found then
      raise exception 'El estudiante de la recepción no existe';
    end if;
  end if;

  if new.nivel is distinct from v_nivel or new.grado is distinct from v_grado then
    raise exception 'El nivel y grado no corresponden a la matrícula de la recepción';
  end if;
  return new;
end $$;

create unique index recepcion_unica_matricula on public.recepciones(matricula_id) where matricula_id is not null;

create function public.sigue_guardar_recepcion_anual(
  p_estudiante_id text,p_cantidades jsonb,p_observaciones text default '',
  p_entregado_por text default '',p_recepcion_id text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor text:=public.sigue_actor_anios(); perfil public.usuarios;
  a public.anios_escolares; m public.matriculas; estudiante public.estudiantes;
  r public.recepciones; l public.listas_utiles; u public.utiles;
  fuente jsonb; v_items jsonb:='[]'; item jsonb;
  cantidad integer; esperada integer; previo integer; diferencia integer;
  total integer:=0; requerido integer:=0; hubo_entrega boolean:=false;
begin
  if actor is null then raise exception 'Identidad institucional requerida'; end if;
  perform pg_advisory_xact_lock(741113);
  select * into perfil from public.usuarios where id=actor;
  select * into a from public.anios_escolares where estado='Activo';
  if a.id is null then raise exception 'Se requiere un año activo'; end if;
  select * into m from public.matriculas where anio_id=a.id and estudiante_id=p_estudiante_id;
  if m.id is null then raise exception 'Sin matrícula en el año activo'; end if;
  if perfil.rol in ('Profesora','Auxiliar') and (perfil.nivel_asignado is distinct from m.nivel or perfil.aula_asignada is distinct from m.grado) then raise exception 'Sólo puede registrar recepciones de su aula asignada'; end if;
  if perfil.rol not in ('Administrador','Directora','Secretaria','Profesora','Auxiliar') then raise exception 'Rol no autorizado'; end if;
  select * into estudiante from public.estudiantes where id=p_estudiante_id;
  select * into r from public.recepciones where matricula_id=m.id for update;
  if p_recepcion_id is not null and (r.id is null or r.id::text<>p_recepcion_id) then raise exception 'La recepción no pertenece a la matrícula activa'; end if;
  if r.id is not null then
    if r.anio_id is distinct from a.id then raise exception 'Recepción fuera del período activo'; end if;
    fuente:=r.items;
  else
    if (select count(*) from public.listas_utiles where "anioEscolar"::text=a.anio::text and nivel=m.nivel and grado=m.grado)<>1 then raise exception 'Se requiere una única lista por año, nivel y grado'; end if;
    select * into l from public.listas_utiles where "anioEscolar"::text=a.anio::text and nivel=m.nivel and grado=m.grado;
    fuente:=l.items;
  end if;
  if jsonb_typeof(p_cantidades) is distinct from 'object' or jsonb_typeof(fuente) is distinct from 'array' then raise exception 'Cantidades o lista inválida'; end if;
  if jsonb_array_length(fuente)=0 then raise exception 'Cantidades o lista inválida'; end if;
  if exists(select 1 from jsonb_object_keys(p_cantidades) k where not exists(select 1 from jsonb_array_elements(fuente) i where i->>'utilId'=k)) then raise exception 'Hay útiles ajenos a la lista'; end if;
  if exists(select 1 from jsonb_array_elements(fuente) i group by i->>'utilId' having count(*)>1) then raise exception 'La lista contiene útiles duplicados'; end if;
  for item in select * from jsonb_array_elements(fuente) loop
    select * into u from public.utiles where id=item->>'utilId' for update;
    if u.id is null then raise exception 'Útil inexistente'; end if;
    esperada:=coalesce((item->>'cantidadEsperada')::integer,(item->>'cantidadRequerida')::integer);
    previo:=coalesce((item->>'cantidadEntregada')::integer,0);
    cantidad:=coalesce((p_cantidades->>u.id)::integer,previo);
    if cantidad<previo or cantidad<0 or cantidad>esperada or esperada is null or esperada<0 then raise exception 'Cantidad fuera de rango o entrega desactualizada'; end if;
    diferencia:=cantidad-previo;
    if diferencia>0 then
      insert into public.movimientos(tipo,"utilId","utilNombre",cantidad,fecha,responsable,motivo,"stockAnterior","stockResultante",anio_id)
      values('Entrada',u.id,u.nombre,diferencia,now(),actor,'Recepción de útiles · matrícula '||m.id::text,u."stockActual",u."stockActual"+diferencia,a.id);
      update public.utiles set "stockActual"=u."stockActual"+diferencia where id=u.id;
      hubo_entrega:=true;
    end if;
    v_items:=v_items||jsonb_build_array(jsonb_build_object('utilId',u.id,'utilNombre',u.nombre,'cantidadEsperada',esperada,'cantidadEntregada',cantidad));
    total:=total+cantidad; requerido:=requerido+esperada;
  end loop;
  if r.id is null then
    insert into public.recepciones(id,"estudianteId","estudianteNombre","apoderadoId","apoderadoNombre",grado,nivel,"fechaRecepcion",items,estado,observaciones,"recibidoPor","entregadoPor","numeroEntregas",anio_id,matricula_id)
    values(gen_random_uuid(),estudiante.id,estudiante.nombres||' '||estudiante.apellidos,estudiante."apoderadoId",estudiante."apoderadoNombre",m.grado,m.nivel,current_date::text,v_items,case when total=0 then 'Pendiente' when total>=requerido then 'Completo' else 'Incompleto' end,coalesce(p_observaciones,''),perfil.nombre,coalesce(p_entregado_por,''),case when hubo_entrega then 1 else 0 end,a.id,m.id)
    returning * into r;
  else
    update public.recepciones set items=v_items,estado=case when total=0 then 'Pendiente' when total>=requerido then 'Completo' else 'Incompleto' end,
      observaciones=coalesce(p_observaciones,''),"recibidoPor"=perfil.nombre,"entregadoPor"=coalesce(p_entregado_por,''),"numeroEntregas"=coalesce(r."numeroEntregas",0)+case when hubo_entrega then 1 else 0 end
    where id=r.id returning * into r;
  end if;
  return to_jsonb(r);
end $$;
revoke all on function public.sigue_guardar_recepcion_anual(text,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.sigue_guardar_recepcion_anual(text,jsonb,text,text,text) to authenticated;
commit;
