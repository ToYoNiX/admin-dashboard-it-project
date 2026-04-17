alter table public.calendars
  add column if not exists title text;

update public.calendars
set title = coalesce(nullif(trim(title), ''), concat(program_level, ' Calendar ', year))
where title is null or length(trim(title)) = 0;

alter table public.calendars
  alter column title set not null;

alter table public.calendars
  drop constraint if exists calendars_title_not_blank;

alter table public.calendars
  add constraint calendars_title_not_blank
  check (length(trim(title)) > 0);

notify pgrst, 'reload schema';
