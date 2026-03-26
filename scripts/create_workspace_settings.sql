create table if not exists public.workspace_settings (
  id text primary key,
  boss_profile jsonb,
  islands jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_workspace_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists workspace_settings_set_updated_at on public.workspace_settings;

create trigger workspace_settings_set_updated_at
before update on public.workspace_settings
for each row
execute function public.set_workspace_settings_updated_at();

insert into public.workspace_settings (id, boss_profile, islands)
values ('default', null, '[]'::jsonb)
on conflict (id) do nothing;
