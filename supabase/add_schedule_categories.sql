alter table public.schedules
  add column if not exists title text;

alter table public.schedules
  add column if not exists category text;

update public.schedules
set title = coalesce(nullif(trim(schedule_type), ''), 'Schedule')
where title is null;

update public.schedules
set category = case
  when schedule_type in ('Quiz 1', 'Quiz 2', 'Final') then 'exams'
  else 'lectures_sections'
end
where category is null;

alter table public.schedules
  alter column title set not null;

alter table public.schedules
  alter column category set not null;

alter table public.schedules
  drop constraint if exists schedules_type_valid;

alter table public.schedules
  drop constraint if exists schedules_title_not_blank;

alter table public.schedules
  drop constraint if exists schedules_category_valid;

alter table public.schedules
  add constraint schedules_title_not_blank
  check (length(trim(title)) > 0);

alter table public.schedules
  add constraint schedules_category_valid
  check (category in ('exams', 'lectures_sections'));

alter table public.schedules
  add constraint schedules_type_valid
  check (schedule_type in ('Quiz 1', 'Quiz 2', 'Final', 'Semester Schedule'));

notify pgrst, 'reload schema';
