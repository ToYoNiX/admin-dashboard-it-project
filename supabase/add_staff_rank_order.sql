alter table if exists public.staff
  add column if not exists display_order integer not null default 0;

notify pgrst, 'reload schema';
