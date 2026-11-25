create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  birth_year smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are insertable by their owner"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Profiles are editable by their owner"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.validate_profile_birth_year()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_year is not null
     and (new.birth_year < 1900 or new.birth_year > extract(year from current_date)::integer - 19) then
    raise exception 'Benchless accounts are available to adults 18 and over.' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger validate_profile_birth_year_before_write
  before insert or update of birth_year on public.profiles
  for each row execute function public.validate_profile_birth_year();

revoke all on function public.validate_profile_birth_year() from public, anon, authenticated;

create or replace function public.sync_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_birth_year text := metadata ->> 'birth_year';
  parsed_birth_year smallint;
  profile_name text := coalesce(nullif(metadata ->> 'full_name', ''), nullif(metadata ->> 'name', ''));
begin
  if raw_birth_year is not null and raw_birth_year <> '' then
    if raw_birth_year !~ '^\d{4}$' then
      raise exception 'A valid birth year is required.' using errcode = '22023';
    end if;
    parsed_birth_year := raw_birth_year::smallint;
    if parsed_birth_year < 1900 or parsed_birth_year > extract(year from current_date)::integer - 19 then
      raise exception 'Benchless accounts are available to adults 18 and over.' using errcode = '22023';
    end if;
  end if;

  insert into public.profiles (id, full_name, birth_year)
  values (new.id, profile_name, parsed_birth_year)
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        birth_year = coalesce(excluded.birth_year, public.profiles.birth_year),
        updated_at = now();
  return new;
end;
$$;

create trigger sync_profile_from_auth_user
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.sync_auth_profile();

revoke all on function public.sync_auth_profile() from public, anon, authenticated;
