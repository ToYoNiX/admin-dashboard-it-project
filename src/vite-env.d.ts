/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_STAFF_TABLE?: string;
  readonly VITE_SUPABASE_CV_BUCKET?: string;
  readonly VITE_SUPABASE_IMAGE_BUCKET?: string;
  readonly VITE_SUPABASE_NEWS_TABLE?: string;
  readonly VITE_SUPABASE_EVENTS_TABLE?: string;
  readonly VITE_SUPABASE_STUDY_PLANS_TABLE?: string;
  readonly VITE_SUPABASE_SCHEDULES_TABLE?: string;
  readonly VITE_SUPABASE_CALENDARS_TABLE?: string;
  readonly VITE_SUPABASE_ACTIVITIES_TABLE?: string;
  readonly VITE_SUPABASE_GALLERY_TABLE?: string;
  readonly VITE_SUPABASE_ADVISOR_RESOURCES_TABLE?: string;
  readonly VITE_SUPABASE_STUDENT_RESOURCES_TABLE?: string;
  readonly VITE_SUPABASE_STUDENTS_TABLE?: string;
  readonly VITE_SUPABASE_ADVISOR_STUDENT_CONVERSATIONS_TABLE?: string;
  readonly VITE_SUPABASE_CONVERSATION_MESSAGES_TABLE?: string;
  readonly VITE_SUPABASE_NEWS_IMAGES_BUCKET?: string;
  readonly VITE_SUPABASE_EVENT_IMAGES_BUCKET?: string;
  readonly VITE_SUPABASE_STUDY_PLAN_FILES_BUCKET?: string;
  readonly VITE_SUPABASE_SCHEDULE_FILES_BUCKET?: string;
  readonly VITE_SUPABASE_CALENDAR_FILES_BUCKET?: string;
  readonly VITE_SUPABASE_ACTIVITY_IMAGES_BUCKET?: string;
  readonly VITE_SUPABASE_GALLERY_IMAGES_BUCKET?: string;
  readonly VITE_SUPABASE_RESOURCES_FILES_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
