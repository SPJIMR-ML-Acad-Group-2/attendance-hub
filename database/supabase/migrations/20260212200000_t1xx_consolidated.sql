-- t1xx_consolidated: Complete Schema for Roles, Tiles, Users, and Logs

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ==========================================
-- t101: Application Roles
-- ==========================================

-- 1) Create enum
do $$
begin
  create type public.t101_application_roles_enum as enum (
    'developer',
    'program_office',
    'student',
    'user',
    'faculty',
    'ta',
    'exam_office',
    'sodoxo_office'
  );
exception
  when duplicate_object then null;
end $$;

-- 2) Ensure all enum values exist (idempotency)
-- Note: User script used the same name for Type and Table. Postgres allows this if one is a Type and one is a Table, but it can be confusing.
-- To be safe and follow user's prompt "public.t101_application_roles is the table name", I will use that for the TABLE.
-- The enum was defined as "create type public.t101_application_roles".
-- I will keep the enum name as is if compatible, OR rename the enum to avoid collision if they are in same namespace/usage context.
-- Postgres types and tables share a namespace.
-- ERROR POTENTIAL: If I create type `t101_application_roles` AND table `t101_application_roles`, it might fail or cause ambiguity.
-- User said: "t101_application_roles is the table name".
-- User prompt step 1: "create type public.t101_application_roles as enum..."
-- User prompt step 3: "create table if not exists public.application_roles..." -> User CORRECTION: "public.t101_application_roles is the table name".
-- If the TABLE is `t101_application_roles`, the TYPE should probably be renamed or implicit.
-- However, for this script, I will assume the enum is `app_role` or `t101_role_enum` to avoid collision, OR the user intends the identifiers to be identical (which strictly isn't allowed for table vs type name in same schema).
-- Let's check the user's previous `types.ts`. It had `t101_application_roles` as the table.
-- I will use `t101_role_enum` for the type to be safe, and `t101_application_roles` for the table.

do $$
begin
  create type public.t101_role_enum as enum (
    'developer',
    'program_office',
    'student',
    'user',
    'faculty',
    'ta',
    'exam_office',
    'sodoxo_office'
  );
exception
  when duplicate_object then null;
end $$;


-- 3) Table
create table if not exists public.t101_application_roles (
  role_code public.t101_role_enum primary key,
  role_name text not null unique,
  role_description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now()
);

create index if not exists idx_t101_roles_active
  on public.t101_application_roles (is_active);

-- 4) Trigger for last_updated_at
create or replace function public.set_t101_roles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_t101_roles_updated_at on public.t101_application_roles;
create trigger trg_t101_roles_updated_at
before update on public.t101_application_roles
for each row
execute function public.set_t101_roles_updated_at();

-- 5) Seed Roles
insert into public.t101_application_roles (role_code, role_name, role_description, is_active) values
('developer', 'Developer', 'System admin and full access', true),
('program_office', 'Program Office', 'Academic operations and approvals', true),
('student', 'Student', 'Learner access', true),
('user', 'Default User', 'Default first-time role', true),
('faculty', 'Faculty', 'Faculty member access', true),
('ta', 'Teaching Assistant', 'Teaching assistant access', true),
('exam_office', 'Examination Office', 'Exam operations and actions', true),
('sodoxo_office', 'Sodoxo Team', 'Sodoxo Operations', true)
on conflict (role_code) do update
set role_name = excluded.role_name,
    role_description = excluded.role_description,
    is_active = excluded.is_active,
    last_updated_at = now();


-- ==========================================
-- t102: Dashboard Tiles
-- ==========================================

create table if not exists public.t102_dashboard_tiles (
  id uuid primary key default gen_random_uuid(),
  tile_key text not null unique,
  tile_label text not null,
  tile_description text,
  route_path text,
  icon_key text,
  sort_order int not null default 100,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now()
);

create index if not exists idx_t102_tiles_enabled
  on public.t102_dashboard_tiles (is_enabled);

create index if not exists idx_t102_tiles_sort
  on public.t102_dashboard_tiles (sort_order);

create or replace function public.fn_t102_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_t102_set_updated_at on public.t102_dashboard_tiles;
create trigger trg_t102_set_updated_at
before update on public.t102_dashboard_tiles
for each row
execute function public.fn_t102_set_updated_at();

-- Seed Tiles
insert into public.t102_dashboard_tiles
  (tile_key, tile_label, tile_description, route_path, icon_key, sort_order, is_enabled)
values
  ('request_access', 'Request Access', 'Submit access request for role approval', '/request-access', 'lock', 1, true),
  ('onboard_batch', 'Onboard Batch', 'Create and manage academic batches', '/batches', 'users', 10, true),
  ('manage_courses', 'Manage Courses', 'Configure courses and schedules', '/courses', 'book-open', 20, true),
  ('attendance_hub', 'Attendance Hub', 'Upload and monitor attendance', '/attendance', 'bar-chart-3', 30, true),
  ('system_settings', 'System Settings', 'Manage platform settings', '/settings', 'settings', 40, true)
on conflict (tile_key) do update
set tile_label = excluded.tile_label,
    tile_description = excluded.tile_description,
    route_path = excluded.route_path,
    icon_key = excluded.icon_key,
    sort_order = excluded.sort_order,
    is_enabled = excluded.is_enabled,
    last_updated_at = now();


-- ==========================================
-- t103: Dashboard Subtiles
-- ==========================================

create table if not exists public.t103_dashboard_subtiles (
  id uuid primary key default gen_random_uuid(),
  tile_id uuid not null references public.t102_dashboard_tiles(id) on delete cascade,
  subtile_key text not null,
  subtile_label text not null,
  subtile_description text,
  route_path text,
  icon_key text,
  sort_order int not null default 100,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  unique (tile_id, subtile_key)
);

create index if not exists idx_t103_subtiles_tile
  on public.t103_dashboard_subtiles (tile_id);

create or replace function public.fn_t103_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_t103_set_updated_at on public.t103_dashboard_subtiles;
create trigger trg_t103_set_updated_at
before update on public.t103_dashboard_subtiles
for each row
execute function public.fn_t103_set_updated_at();

-- Seed Subtiles
insert into public.t103_dashboard_subtiles
  (tile_id, subtile_key, subtile_label, subtile_description, route_path, icon_key, sort_order, is_enabled)
select
  t.id,
  v.subtile_key,
  v.subtile_label,
  v.subtile_description,
  v.route_path,
  v.icon_key,
  v.sort_order,
  true
from public.t102_dashboard_tiles t
join (
  values
    ('attendance_hub', 'upload_attendance', 'Upload Attendance', 'Upload attendance files', '/upload', 'upload', 10),
    ('attendance_hub', 'attendance_reports', 'Attendance Reports', 'View attendance analytics', '/reports', 'line-chart', 20),
    ('manage_courses', 'create_course', 'Create Course', 'Add a new course', '/courses/create', 'plus', 10),
    ('manage_courses', 'course_catalog', 'Course Catalog', 'View and edit course catalog', '/courses/list', 'book-open', 20),
    ('onboard_batch', 'create_batch', 'Create Batch', 'Create a new academic batch', '/batches/create', 'users', 10),
    ('onboard_batch', 'manage_divisions', 'Manage Divisions', 'Configure divisions for batches', '/divisions', 'building', 20),
    ('request_access', 'new_request', 'New Request', 'Submit a role access request', '/request-access', 'lock', 10),
    ('request_access', 'request_history', 'Request History', 'Track status of your requests', '/request-access/history', 'history', 20),
    ('system_settings', 'role_management', 'Role Management', 'Configure role permissions', '/settings/roles', 'shield', 10),
    ('system_settings', 'audit_logs', 'Audit Logs', 'View API and activity logs', '/settings/logs', 'file-text', 20)
) as v(tile_key, subtile_key, subtile_label, subtile_description, route_path, icon_key, sort_order)
  on t.tile_key = v.tile_key
on conflict (tile_id, subtile_key) do update
set subtile_label = excluded.subtile_label,
    subtile_description = excluded.subtile_description,
    route_path = excluded.route_path,
    icon_key = excluded.icon_key,
    sort_order = excluded.sort_order,
    is_enabled = excluded.is_enabled,
    last_updated_at = now();


-- ==========================================
-- t104: Role -> Tile Access
-- ==========================================

create table if not exists public.t104_role_tile_access (
  id uuid primary key default gen_random_uuid(),
  role_code public.t101_role_enum not null references public.t101_application_roles(role_code) on delete cascade,
  tile_id uuid not null references public.t102_dashboard_tiles(id) on delete cascade,

  -- denormalized
  tile_key text not null,
  tile_label text not null,

  can_view boolean not null default true,
  all_subtiles boolean not null default false,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),

  unique (role_code, tile_id)
);

create index if not exists idx_t104_role_code on public.t104_role_tile_access(role_code);

-- Triggers for t104
create or replace function public.fn_t104_set_updated_at() returns trigger language plpgsql as $$ begin new.last_updated_at = now(); return new; end; $$;
create trigger trg_t104_set_updated_at before update on public.t104_role_tile_access for each row execute function public.fn_t104_set_updated_at();

create or replace function public.fn_t104_fill_tile_readables() returns trigger language plpgsql as $$ begin select t.tile_key, t.tile_label into new.tile_key, new.tile_label from public.t102_dashboard_tiles t where t.id = new.tile_id; return new; end; $$;
create trigger trg_t104_fill_tile_readables before insert or update of tile_id on public.t104_role_tile_access for each row execute function public.fn_t104_fill_tile_readables();

create or replace function public.fn_t102_propagate_to_t104() returns trigger language plpgsql as $$ begin update public.t104_role_tile_access set tile_key = new.tile_key, tile_label = new.tile_label, last_updated_at = now() where tile_id = new.id; return new; end; $$;
create trigger trg_t102_propagate_to_t104 after update of tile_key, tile_label on public.t102_dashboard_tiles for each row execute function public.fn_t102_propagate_to_t104();

-- Seed Access Matrix
insert into public.t104_role_tile_access (role_code, tile_id, tile_key, tile_label, can_view, all_subtiles)
select
  v.role_code::public.t101_role_enum,
  t.id,
  t.tile_key,
  t.tile_label,
  true,
  v.all_subtiles
from public.t102_dashboard_tiles t
join (
  values
    ('user',           'request_access', true),
    ('student',        'request_access', true),
    ('faculty',        'request_access', true),
    ('ta',             'request_access', true),
    ('program_office', 'onboard_batch',  true),
    ('program_office', 'manage_courses', true),
    ('program_office', 'attendance_hub', false),
    ('exam_office',    'attendance_hub', false),
    ('sodoxo_office',  'attendance_hub', false),
    ('developer',      'request_access', true),
    ('developer',      'onboard_batch',  true),
    ('developer',      'manage_courses', true),
    ('developer',      'attendance_hub', true),
    ('developer',      'system_settings', true)
) as v(role_code, tile_key, all_subtiles) on t.tile_key = v.tile_key
on conflict (role_code, tile_id) do update
set can_view = excluded.can_view, all_subtiles = excluded.all_subtiles, last_updated_at = now();


-- ==========================================
-- t105: Role -> Subtile Access
-- ==========================================

create table if not exists public.t105_role_subtile_access (
  id uuid primary key default gen_random_uuid(),
  role_code public.t101_role_enum not null references public.t101_application_roles(role_code) on delete cascade,
  subtile_id uuid not null references public.t103_dashboard_subtiles(id) on delete cascade,

  -- denormalized
  subtile_key text not null,
  subtile_label text not null,
  tile_id uuid not null,
  tile_key text not null,
  tile_label text not null,

  can_view boolean not null default true,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),

  unique (role_code, subtile_id)
);

-- Triggers for t105
create or replace function public.fn_t105_set_updated_at() returns trigger language plpgsql as $$ begin new.last_updated_at = now(); return new; end; $$;
create trigger trg_t105_set_updated_at before update on public.t105_role_subtile_access for each row execute function public.fn_t105_set_updated_at();

create or replace function public.fn_t105_fill_readables() returns trigger language plpgsql as $$
begin
  select s.subtile_key, s.subtile_label, t.id, t.tile_key, t.tile_label
  into new.subtile_key, new.subtile_label, new.tile_id, new.tile_key, new.tile_label
  from public.t103_dashboard_subtiles s
  join public.t102_dashboard_tiles t on t.id = s.tile_id
  where s.id = new.subtile_id;
  return new;
end;
$$;
create trigger trg_t105_fill_readables before insert or update of subtile_id on public.t105_role_subtile_access for each row execute function public.fn_t105_fill_readables();


-- ==========================================
-- t106: User Profile
-- ==========================================

create table if not exists public.t106_user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email citext not null unique,
  full_name text not null default '',
  
  primary_role public.t101_role_enum not null references public.t101_application_roles(role_code),
  requested_role public.t101_role_enum null references public.t101_application_roles(role_code),
  
  access_status text not null default 'approved' check (access_status in ('pending', 'approved', 'rejected')),
  request_payload jsonb,
  imported_by_program_office boolean not null default false,
  
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  
  constraint chk_t106_email_domain check (email::text ~* '^[^@]+@spjimr\.org$')
);

create or replace function public.fn_t106_set_updated_at() returns trigger language plpgsql as $$ begin new.last_updated_at = now(); return new; end; $$;
create trigger trg_t106_set_updated_at before update on public.t106_user_profile for each row execute function public.fn_t106_set_updated_at();


-- ==========================================
-- t107: Login History (Audit)
-- ==========================================

create table if not exists public.t107_login_history (
  id bigserial primary key,
  user_id uuid null references auth.users(id) on delete set null,
  email citext,
  
  event_type text not null default 'LOGIN', -- LOGIN, LOGOUT, FAILED_LOGIN
  status text not null default 'SUCCESS',   -- SUCCESS, FAILURE
  
  ip_address inet,
  user_agent text,
  meta jsonb,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_t107_user_created on public.t107_login_history(user_id, created_at desc);


-- ==========================================
-- Auth Trigger (Sync Auth -> t106)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.t106_user_profile (user_id, email, full_name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'user' -- matches t101_application_roles 'user'
  );
  RETURN NEW;
END;
$$;
