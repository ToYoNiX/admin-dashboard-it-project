alter table if exists public.study_plans add column if not exists master_cs_old_curriculum text;
alter table if exists public.study_plans add column if not exists master_is_old_curriculum text;
alter table if exists public.study_plans add column if not exists master_ai_old_curriculum text;
alter table if exists public.study_plans add column if not exists master_cs_new_curriculum text;
alter table if exists public.study_plans add column if not exists master_is_new_curriculum text;
alter table if exists public.study_plans add column if not exists master_ai_new_curriculum text;
alter table if exists public.study_plans add column if not exists phd_cs_old_curriculum text;
alter table if exists public.study_plans add column if not exists phd_is_old_curriculum text;
alter table if exists public.study_plans add column if not exists phd_ai_old_curriculum text;
alter table if exists public.study_plans add column if not exists phd_cs_new_curriculum text;
alter table if exists public.study_plans add column if not exists phd_is_new_curriculum text;
alter table if exists public.study_plans add column if not exists phd_ai_new_curriculum text;
alter table if exists public.study_plans add column if not exists diploma_big_data jsonb;
alter table if exists public.study_plans add column if not exists diploma_applied_ai jsonb;
alter table if exists public.study_plans add column if not exists diploma_business_intelligence jsonb;

alter table if exists public.study_plans
  drop constraint if exists study_plans_professional_diplomas_array;

alter table if exists public.study_plans
  add constraint study_plans_diploma_big_data_array
  check (diploma_big_data is null or jsonb_typeof(diploma_big_data) = 'array');

alter table if exists public.study_plans
  add constraint study_plans_diploma_applied_ai_array
  check (diploma_applied_ai is null or jsonb_typeof(diploma_applied_ai) = 'array');

alter table if exists public.study_plans
  add constraint study_plans_diploma_business_intelligence_array
  check (diploma_business_intelligence is null or jsonb_typeof(diploma_business_intelligence) = 'array');

notify pgrst, 'reload schema';
