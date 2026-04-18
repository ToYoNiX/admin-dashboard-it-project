alter table public.students add column if not exists college text;
alter table public.students add column if not exists team_code text;
alter table public.students add column if not exists amit text;
alter table public.students add column if not exists class_name text;
alter table public.students add column if not exists mobile text;
alter table public.students add column if not exists email text;
alter table public.students add column if not exists advisor_name text;

notify pgrst, 'reload schema';
