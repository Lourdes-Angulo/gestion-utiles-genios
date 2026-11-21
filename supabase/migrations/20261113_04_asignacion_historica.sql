begin;
-- Asignación explícita de registros previos al primer año, tras crear sus matrículas.
-- No deduce el año de fechas ni del grado actual del alumno.
create function public.sigue_asignar_historico(p_anio uuid,p_recepciones text[],p_movimientos text[]) returns void
language plpgsql security definer set search_path='' as $$
declare a public.anios_escolares;
begin
  if public.sigue_rol_anios() not in ('Administrador','Directora') or public.sigue_rol_anios() is null then raise exception 'Requiere Administrador o Directora'; end if;
  perform pg_advisory_xact_lock(741113);
  select * into a from public.anios_escolares where id=p_anio for update;
  if a.id is null or a.estado<>'En preparación' or exists(select 1 from public.anios_escolares where estado in ('Activo','Cerrado')) then raise exception 'Sólo durante la preparación inicial antes de activar el primer año'; end if;
  if exists(select 1 from unnest(p_recepciones) x left join public.recepciones r on r.id::text=x where r.id is null or (r.anio_id is not null and r.anio_id<>a.id)) then raise exception 'Recepción inexistente o asignada a otro período'; end if;
  if exists(select 1 from unnest(p_movimientos) x left join public.movimientos m on m.id::text=x where m.id is null or (m.anio_id is not null and m.anio_id<>a.id)) then raise exception 'Movimiento inexistente o asignado a otro período'; end if;
  if exists(select 1 from public.recepciones r where r.id::text=any(p_recepciones) and not exists(select 1 from public.matriculas m where m.anio_id=a.id and m.estudiante_id=r."estudianteId")) then raise exception 'Todas las recepciones requieren matrícula revisada'; end if;
  insert into public.sigue_operaciones_periodo_internas values(txid_current());
  update public.recepciones r set anio_id=a.id,matricula_id=m.id from public.matriculas m
    where r.id::text=any(p_recepciones) and m.anio_id=a.id and m.estudiante_id=r."estudianteId" and r.anio_id is null;
  update public.movimientos set anio_id=a.id where id::text=any(p_movimientos) and anio_id is null;
  delete from public.sigue_operaciones_periodo_internas where transaccion=txid_current();
end $$;
revoke all on function public.sigue_asignar_historico(uuid,text[],text[]) from public,anon,authenticated;
grant execute on function public.sigue_asignar_historico(uuid,text[],text[]) to authenticated;
commit;
