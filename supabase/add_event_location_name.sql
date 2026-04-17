alter table public.events
  add column if not exists location_name text;

alter table public.events
  drop constraint if exists events_location_name_not_blank;

alter table public.events
  add constraint events_location_name_not_blank
  check (location_name is null or length(trim(location_name)) > 0);

notify pgrst, 'reload schema';
