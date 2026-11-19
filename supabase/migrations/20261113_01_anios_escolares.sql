-- Revisar docs/ANIOS_ESCOLARES.md y ejecutar primero el diagnóstico.
-- Transacción completa. No asigna períodos a datos anteriores.
begin;

do $$
declare t text; c text;
begin
  foreach t in array array['usuarios','estudiantes','utiles','listas_utiles','recepciones','movimientos','auditoria'] loop
    if to_regclass('public.' || t) is null then raise exception 'Falta la tabla %', t; end if;
  end loop;
  foreach t in array array['usuarios','estudiantes','utiles','listas_utiles'] loop
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='id' and data_type in ('text','character varying')) then
      raise exception 'Revisar tipo de %.id: esta migración requiere identificadores text/varchar', t;
    end if;
  end loop;
  foreach c in array array['authUserId','clerk_user_id','rol','estado','debe_cambiar_contrasena'] loop
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='usuarios' and column_name=c) then raise exception 'Falta usuarios.%',c; end if;
  end loop;
end $$;

create table public.anios_escolares (
  id uuid primary key default gen_random_uuid(),
  anio integer not null unique check (anio between 1 and 9999),
  estado text not null default 'En preparación' check (estado in ('En preparación','Activo','Cerrado')),
  fecha_inicio date not null,
  fecha_fin date not null check (fecha_fin >= fecha_inicio),
  creado_en timestamptz not null default now(),
  creado_por text not null references public.usuarios(id),
  cerrado_en timestamptz,
  cerrado_por text references public.usuarios(id),
  observaciones text not null default '',
  check ((estado='Cerrado') = (cerrado_en is not null and cerrado_por is not null)),
  check (extract(year from fecha_inicio)=anio and extract(year from fecha_fin)=anio)
);
create unique index anios_unico_activo on public.anios_escolares ((estado)) where estado='Activo';

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  anio_id uuid not null references public.anios_escolares(id),
  estudiante_id text not null references public.estudiantes(id),
  nivel text not null check (nivel in ('Inicial','Primaria')),
  grado text not null,
  creado_por text not null references public.usuarios(id),
  creado_en timestamptz not null default now(),
  unique (anio_id,estudiante_id),
  unique (id,anio_id),
  check ((nivel='Inicial' and grado in ('3 años','4 años','5 años')) or
    (nivel='Primaria' and grado in ('1er Grado','2do Grado','3er Grado','4to Grado','5to Grado','6to Grado')))
);
create index matriculas_estudiante on public.matriculas(estudiante_id,anio_id);
create table public.asignaciones_personal_anuales (
  id uuid primary key default gen_random_uuid(),
  anio_id uuid not null references public.anios_escolares(id),
  usuario_id text not null references public.usuarios(id),
  nivel text not null check (nivel in ('Inicial','Primaria')),
  grado text not null,
  responsable text not null references public.usuarios(id),
  actualizado_en timestamptz not null default now(),
  unique(anio_id,usuario_id),
  check ((nivel='Inicial' and grado in ('3 años','4 años','5 años')) or
    (nivel='Primaria' and grado in ('1er Grado','2do Grado','3er Grado','4to Grado','5to Grado','6to Grado')))
);

create table public.continuidad_estudiantes (
  id uuid primary key default gen_random_uuid(),
  origen_id uuid not null references public.anios_escolares(id),
  destino_id uuid not null references public.anios_escolares(id),
  estudiante_id text not null references public.estudiantes(id),
  situacion text not null check (situacion in ('Pendiente de revisión','Continúa y promociona','Continúa en el mismo grado','Se retira','Se traslada','Egresa')),
  nivel text,
  grado text,
  observaciones text not null default '',
  responsable text not null references public.usuarios(id),
  actualizado_en timestamptz not null default now(),
  unique(destino_id,estudiante_id),
  foreign key (origen_id,estudiante_id) references public.matriculas(anio_id,estudiante_id),
  check (origen_id<>destino_id),
  check ((situacion in ('Continúa y promociona','Continúa en el mismo grado')) = (nivel is not null and grado is not null))
);

create table public.evaluaciones_stock (
  id uuid primary key default gen_random_uuid(),
  anio_id uuid not null references public.anios_escolares(id),
  util_id text not null references public.utiles(id),
  contabilizado integer not null check (contabilizado>=0),
  bueno integer not null check (bueno>=0),
  deteriorado integer not null check (deteriorado>=0),
  vencido integer not null check (vencido>=0),
  inutilizable integer not null check (inutilizable>=0),
  comprometido integer not null check (comprometido>=0),
  observaciones text not null default '',
  evidencia text,
  responsable text not null references public.usuarios(id),
  actualizado_en timestamptz not null default now(),
  unique(anio_id,util_id),
  check (contabilizado=bueno+deteriorado+vencido+inutilizable+comprometido)
);

create table public.cierres_anuales (
  id uuid primary key default gen_random_uuid(),
  anio_id uuid not null unique references public.anios_escolares(id),
  destino_id uuid not null unique references public.anios_escolares(id),
  responsable text not null references public.usuarios(id),
  creado_en timestamptz not null default now(),
  observaciones text not null,
  check (anio_id<>destino_id)
);
create table public.detalle_cierre_stock (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references public.cierres_anuales(id),
  util_id text not null references public.utiles(id),
  evaluacion jsonb not null,
  saldo_apertura integer not null check (saldo_apertura>=0),
  deteriorado_pendiente integer not null check (deteriorado_pendiente>=0),
  unique(cierre_id,util_id)
);
create table public.bajas_inventario (
  id uuid primary key,
  anio_id uuid not null references public.anios_escolares(id),
  util_id text not null references public.utiles(id),
  cantidad integer not null check (cantidad>0),
  motivo text not null check (motivo in ('Deterioro','Vencimiento','Rotura','Pérdida','Otro')),
  observaciones text not null check (length(trim(observaciones))>0),
  evidencia text,
  responsable text not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);
-- Auditoría específica con identidad textual compatible con Supabase Auth y Clerk.
create table public.eventos_anios (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id text not null,
  accion text not null,
  responsable text not null references public.usuarios(id),
  sujeto text not null,
  fecha timestamptz not null default now(),
  anterior jsonb,
  nuevo jsonb
);
create index eventos_anios_fecha on public.eventos_anios(fecha desc);
-- Autorización interna por transacción. Los roles de API carecen de acceso.
create table public.sigue_operaciones_periodo_internas (transaccion bigint primary key);
alter table public.sigue_operaciones_periodo_internas enable row level security;
revoke all on public.sigue_operaciones_periodo_internas from public,anon,authenticated;

alter table public.recepciones add column anio_id uuid references public.anios_escolares(id);
alter table public.recepciones add column matricula_id uuid;
alter table public.recepciones add constraint recepcion_matricula_anio foreign key (matricula_id,anio_id) references public.matriculas(id,anio_id);
create index recepciones_periodo on public.recepciones(anio_id,matricula_id);
alter table public.movimientos add column anio_id uuid references public.anios_escolares(id);
create index movimientos_periodo on public.movimientos(anio_id);
-- Las listas mantienen su columna existente anioEscolar. No se reescribe el histórico.

create function public.sigue_actor_anios() returns text
language sql stable security definer set search_path='' as $$
  select u.id
  from public.usuarios u
  where u.id = public.sigue_usuario_autenticado_id()
    and u.estado = 'Activo'
    and u.debe_cambiar_contrasena = false
    and u.rol in ('Administrador','Directora','Secretaria','Profesora','Auxiliar')
  limit 1
$$;
create function public.sigue_rol_anios() returns text
language sql stable security definer set search_path='' as $$
  select rol from public.usuarios where id=public.sigue_actor_anios()
$$;

create function public.sigue_auditar_anios() returns trigger
language plpgsql security definer set search_path='' as $$
declare a text := public.sigue_actor_anios();
begin
  if a is null then raise exception 'Identidad institucional requerida'; end if;
  insert into public.eventos_anios(tabla,registro_id,accion,responsable,sujeto,anterior,nuevo)
  values(TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id'),TG_OP,a,auth.jwt()->>'sub',
    case when TG_OP<>'INSERT' then to_jsonb(old) end,case when TG_OP<>'DELETE' then to_jsonb(new) end);
  return coalesce(new,old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['anios_escolares','matriculas','asignaciones_personal_anuales','continuidad_estudiantes','evaluaciones_stock','cierres_anuales','detalle_cierre_stock','bajas_inventario','eventos_anios'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    if t in ('matriculas','anios_escolares') then
      -- El alcance por aula sigue siendo obligatorio para docentes.
      execute format('create policy lectura on public.%I for select to authenticated using (public.sigue_rol_anios() in (''Administrador'',''Directora'',''Secretaria'') or (public.sigue_rol_anios() in (''Profesora'',''Auxiliar'') %s))',t,
        case when t='matriculas' then 'and exists (select 1 from public.usuarios u where u.id=public.sigue_actor_anios() and u.nivel_asignado=nivel and u.aula_asignada=grado)' else '' end);
    else
      execute format('create policy lectura on public.%I for select to authenticated using (public.sigue_rol_anios() in (''Administrador'',''Directora'',''Secretaria''))',t);
    end if;
    if t<>'eventos_anios' then
      execute format('create trigger auditar_anios after insert or update or delete on public.%I for each row execute function public.sigue_auditar_anios()',t);
    end if;
  end loop;
end $$;

-- Bloqueo compartido con todas las escrituras ordinarias y las RPC administrativas.
create function public.sigue_validar_periodo() returns trigger
language plpgsql security definer set search_path='' as $$
declare a public.anios_escolares; m public.matriculas; v uuid; e public.evaluaciones_stock; diferencia integer;
begin
  perform pg_advisory_xact_lock(741113);
  -- Sólo las RPC administrativas pueden registrar esta autorización transaccional.
  if exists(select 1 from public.sigue_operaciones_periodo_internas where transaccion=txid_current()) then
    return coalesce(new,old);
  end if;
  if not exists(select 1 from public.anios_escolares) then return coalesce(new,old); end if;
  if TG_TABLE_NAME='listas_utiles' then
    if TG_OP<>'INSERT' and exists(select 1 from public.anios_escolares where anio::text=old."anioEscolar"::text and estado='Cerrado') then raise exception 'Lista de un período cerrado'; end if;
    if TG_OP<>'DELETE' and not exists(select 1 from public.anios_escolares where anio::text=new."anioEscolar"::text and estado<>'Cerrado') then raise exception 'Año no registrado o cerrado'; end if;
    if TG_OP<>'DELETE' and exists(select 1 from public.listas_utiles l where l."anioEscolar"::text=new."anioEscolar"::text and l.nivel=new.nivel and l.grado=new.grado and l.id<>new.id) then raise exception 'Ya existe una lista para ese año, nivel y grado'; end if;
  elsif TG_TABLE_NAME='utiles' then
    if TG_OP='UPDATE' and new."stockActual" is distinct from old."stockActual" and not exists(select 1 from public.anios_escolares where estado='Activo') then raise exception 'Se requiere un año activo para modificar stock'; end if;
    if TG_OP='INSERT' and new."stockActual"<>0 and not exists(select 1 from public.anios_escolares where estado='Activo') then raise exception 'Se requiere un año activo'; end if;
    if new."stockActual"<0 then raise exception 'El stock no puede ser negativo'; end if;
    if TG_OP='UPDATE' and new."stockActual" is distinct from old."stockActual" then
      select e1.* into e from public.evaluaciones_stock e1 join public.anios_escolares a1 on a1.id=e1.anio_id where a1.estado='Activo' and e1.util_id=old.id for update of e1;
      if e.id is not null then
        diferencia:=new."stockActual"-old."stockActual";
        if e.contabilizado<>old."stockActual" or e.bueno+diferencia<0 then raise exception 'Stock apto insuficiente o evaluación desactualizada'; end if;
        update public.evaluaciones_stock set contabilizado=contabilizado+diferencia,bueno=bueno+diferencia,responsable=public.sigue_actor_anios(),actualizado_en=now() where id=e.id;
      end if;
    end if;
  else
    if TG_OP<>'INSERT' then
      v:=old.anio_id;
      if v is null or not exists(select 1 from public.anios_escolares where id=v and estado='Activo') then raise exception 'Registro histórico o sin período validado'; end if;
    end if;
    if TG_OP<>'DELETE' then
      select * into a from public.anios_escolares where estado='Activo';
      if a.id is null then raise exception 'No hay año activo'; end if;
      if new.anio_id is not null and new.anio_id<>a.id then raise exception 'El período debe estar activo'; end if;
      new.anio_id:=a.id;
      if TG_TABLE_NAME='recepciones' then
        select * into m from public.matriculas where anio_id=a.id and estudiante_id=new."estudianteId";
        if m.id is null then raise exception 'El estudiante requiere matrícula en el año activo'; end if;
        new.matricula_id:=m.id;
        new.grado:=m.grado; new.nivel:=m.nivel;
      end if;
    end if;
  end if;
  return coalesce(new,old);
end $$;
create trigger periodo_recepciones before insert or update or delete on public.recepciones for each row execute function public.sigue_validar_periodo();
create trigger periodo_movimientos before insert or update or delete on public.movimientos for each row execute function public.sigue_validar_periodo();
create trigger periodo_listas before insert or update or delete on public.listas_utiles for each row execute function public.sigue_validar_periodo();
create trigger periodo_stock before insert or update on public.utiles for each row execute function public.sigue_validar_periodo();

revoke all on function public.sigue_actor_anios(),public.sigue_rol_anios(),public.sigue_auditar_anios(),public.sigue_validar_periodo() from public,anon,authenticated;
grant execute on function public.sigue_actor_anios(),public.sigue_rol_anios() to authenticated;
commit;
