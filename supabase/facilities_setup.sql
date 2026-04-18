create table if not exists public.facilities_sections (
  id uuid primary key,
  section_type text not null check (section_type in ('must-facilities', 'international-students-handbook')),
  title text not null,
  content_html text not null default '',
  thumbnail_path text,
  gallery_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facilities_sections_section_type_idx
  on public.facilities_sections (section_type, created_at desc);

alter table public.facilities_sections enable row level security;

drop policy if exists "Allow authenticated read facilities_sections" on public.facilities_sections;
create policy "Allow authenticated read facilities_sections"
on public.facilities_sections
for select
to authenticated
using (true);

drop policy if exists "Allow authenticated insert facilities_sections" on public.facilities_sections;
create policy "Allow authenticated insert facilities_sections"
on public.facilities_sections
for insert
to authenticated
with check (true);

drop policy if exists "Allow authenticated update facilities_sections" on public.facilities_sections;
create policy "Allow authenticated update facilities_sections"
on public.facilities_sections
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow authenticated delete facilities_sections" on public.facilities_sections;
create policy "Allow authenticated delete facilities_sections"
on public.facilities_sections
for delete
to authenticated
using (true);

create or replace function public.set_facilities_sections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_facilities_sections_updated_at on public.facilities_sections;
create trigger set_facilities_sections_updated_at
before update on public.facilities_sections
for each row
execute function public.set_facilities_sections_updated_at();

-- Create a public bucket named `facilities-images` in Supabase Storage
-- and allow authenticated users to read/write objects in that bucket.
