-- Create users table
create table public.users (
  id uuid not null references auth.users on delete cascade,
  email text not null,
  name text,
  role text not null default 'USER' check (role in ('DEVELOPER', 'PROGRAM_OFFICE', 'USER', 'STUDENT')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  is_active boolean not null default true,
  primary key (id)
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.users for update
  using ( auth.uid() = id );

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'USER'  -- Default role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
