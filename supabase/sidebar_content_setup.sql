create table if not exists public.important_links (
  id uuid primary key,
  title text not null,
  description text not null,
  href text not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_information (
  key text primary key,
  email text,
  phone text,
  address text,
  map_link text,
  updated_at timestamptz not null default now()
);
-- mostafa mahmoud
alter table public.important_links enable row level security;
alter table public.contact_information enable row level security;

drop policy if exists "Allow authenticated read important_links" on public.important_links;
create policy "Allow authenticated read important_links" on public.important_links for select to authenticated using (true);
drop policy if exists "Allow authenticated insert important_links" on public.important_links;
create policy "Allow authenticated insert important_links" on public.important_links for insert to authenticated with check (true);
drop policy if exists "Allow authenticated update important_links" on public.important_links;
create policy "Allow authenticated update important_links" on public.important_links for update to authenticated using (true) with check (true);
drop policy if exists "Allow authenticated delete important_links" on public.important_links;
create policy "Allow authenticated delete important_links" on public.important_links for delete to authenticated using (true);

drop policy if exists "Allow authenticated read contact_information" on public.contact_information;
create policy "Allow authenticated read contact_information" on public.contact_information for select to authenticated using (true);
drop policy if exists "Allow authenticated insert contact_information" on public.contact_information;
create policy "Allow authenticated insert contact_information" on public.contact_information for insert to authenticated with check (true);
drop policy if exists "Allow authenticated update contact_information" on public.contact_information;
create policy "Allow authenticated update contact_information" on public.contact_information for update to authenticated using (true) with check (true);
drop policy if exists "Allow authenticated delete contact_information" on public.contact_information;
create policy "Allow authenticated delete contact_information" on public.contact_information for delete to authenticated using (true);

-- Create storage bucket: important-links-images
-- Add an array column to news if you want multiple links per item:
-- alter table public.news add column if not exists link_urls text[];
