alter table public.students
  add column if not exists status text;

update public.students
set status = 'active'
where status is null or length(trim(status)) = 0;

with students_to_discontinue as (
  select student_id
  from public.students
  order by created_at asc, student_id asc
  limit 2
)
update public.students
set status = 'discontinued'
where student_id in (select student_id from students_to_discontinue);

alter table public.students
  alter column status set default 'active';

alter table public.students
  alter column status set not null;

alter table public.students
  drop constraint if exists students_status_valid;

alter table public.students
  add constraint students_status_valid
  check (status in ('active', 'discontinued'));

notify pgrst, 'reload schema';
