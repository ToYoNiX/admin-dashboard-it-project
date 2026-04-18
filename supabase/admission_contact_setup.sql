create table if not exists public.admission_sections (
  section_key text primary key check (section_key in ('how-to-apply', 'required-documents', 'external-transfer-requirements')),
  steps text[] not null default '{}',
  attachments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.international_handbook_documents (
  key text primary key,
  title text not null,
  file_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('super_admin_message', 'complaint', 'suggestion')),
  sender_name text not null,
  sender_email text not null,
  subject text,
  message_text text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admission_sections enable row level security;
alter table public.international_handbook_documents enable row level security;
alter table public.contact_submissions enable row level security;

drop policy if exists "Allow authenticated read admission_sections" on public.admission_sections;
create policy "Allow authenticated read admission_sections" on public.admission_sections for select to authenticated using (true);
drop policy if exists "Allow authenticated insert admission_sections" on public.admission_sections;
create policy "Allow authenticated insert admission_sections" on public.admission_sections for insert to authenticated with check (true);
drop policy if exists "Allow authenticated update admission_sections" on public.admission_sections;
create policy "Allow authenticated update admission_sections" on public.admission_sections for update to authenticated using (true) with check (true);
drop policy if exists "Allow authenticated delete admission_sections" on public.admission_sections;
create policy "Allow authenticated delete admission_sections" on public.admission_sections for delete to authenticated using (true);

drop policy if exists "Allow authenticated read international_handbook_documents" on public.international_handbook_documents;
create policy "Allow authenticated read international_handbook_documents" on public.international_handbook_documents for select to authenticated using (true);
drop policy if exists "Allow authenticated insert international_handbook_documents" on public.international_handbook_documents;
create policy "Allow authenticated insert international_handbook_documents" on public.international_handbook_documents for insert to authenticated with check (true);
drop policy if exists "Allow authenticated update international_handbook_documents" on public.international_handbook_documents;
create policy "Allow authenticated update international_handbook_documents" on public.international_handbook_documents for update to authenticated using (true) with check (true);
drop policy if exists "Allow authenticated delete international_handbook_documents" on public.international_handbook_documents;
create policy "Allow authenticated delete international_handbook_documents" on public.international_handbook_documents for delete to authenticated using (true);

drop policy if exists "Allow authenticated read contact_submissions" on public.contact_submissions;
create policy "Allow authenticated read contact_submissions" on public.contact_submissions for select to authenticated using (true);
drop policy if exists "Allow authenticated insert contact_submissions" on public.contact_submissions;
create policy "Allow authenticated insert contact_submissions" on public.contact_submissions for insert to authenticated with check (true);
drop policy if exists "Allow authenticated update contact_submissions" on public.contact_submissions;
create policy "Allow authenticated update contact_submissions" on public.contact_submissions for update to authenticated using (true) with check (true);
drop policy if exists "Allow authenticated delete contact_submissions" on public.contact_submissions;
create policy "Allow authenticated delete contact_submissions" on public.contact_submissions for delete to authenticated using (true);

-- Create storage buckets:
-- 1. admission-files
-- 2. international-handbook-files
--
-- News multi-link support:
-- alter table public.news add column if not exists link_urls text[];
