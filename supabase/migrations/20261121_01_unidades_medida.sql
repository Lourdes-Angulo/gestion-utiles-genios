-- La tabla ya existe. Las políticas y los permisos de lectura vigentes se conservan.
alter table public.unidades_medida enable row level security;

create policy unidades_medida_insert_rol_institucional
on public.unidades_medida as restrictive
for insert to public
with check (public.sigue_rol_anios() in ('Administrador', 'Directora', 'Secretaria'));

create policy unidades_medida_insert_gestion
on public.unidades_medida
for insert to authenticated
with check (public.sigue_rol_anios() in ('Administrador', 'Directora', 'Secretaria'));

-- Protege también frente a inserciones simultáneas con distinta capitalización o espacios.
create unique index unidades_medida_nombre_normalizado_uidx
on public.unidades_medida (lower(btrim(regexp_replace(nombre, '[[:space:]]+', ' ', 'g'))));

alter table public.unidades_medida
add constraint unidades_medida_nombre_no_vacio
check (nombre is not null and nombre ~ '[^[:space:]]');
