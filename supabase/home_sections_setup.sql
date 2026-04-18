create table if not exists public.home_sections (
  section_key text primary key check (section_key in ('about-sector', 'mission', 'vision', 'sector-plan')),
  title text,
  content_text text,
  image_path text,
  file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_sections enable row level security;

drop policy if exists "Allow authenticated read home_sections" on public.home_sections;
create policy "Allow authenticated read home_sections"
on public.home_sections
for select
to authenticated
using (true);

drop policy if exists "Allow authenticated insert home_sections" on public.home_sections;
create policy "Allow authenticated insert home_sections"
on public.home_sections
for insert
to authenticated
with check (true);

drop policy if exists "Allow authenticated update home_sections" on public.home_sections;
create policy "Allow authenticated update home_sections"
on public.home_sections
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow authenticated delete home_sections" on public.home_sections;
create policy "Allow authenticated delete home_sections"
on public.home_sections
for delete
to authenticated
using (true);

acreate or replace function public.set_home_sections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_home_sections_updated_at on public.home_sections;
create trigger set_home_sections_updated_at
before update on public.home_sections
for each row
execute function public.set_home_sections_updated_at();

-- Create two public Supabase Storage buckets:
-- 1. `home-images`
-- 2. `home-files`
