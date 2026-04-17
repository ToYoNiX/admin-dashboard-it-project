import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseStaffTable =
  import.meta.env.VITE_SUPABASE_STAFF_TABLE || 'staff';
export const supabaseCvBucket =
  import.meta.env.VITE_SUPABASE_CV_BUCKET || 'staff-cv';
export const supabaseImageBucket =
  import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'staff-images';
export const supabaseNewsTable =
  import.meta.env.VITE_SUPABASE_NEWS_TABLE || 'news';
export const supabaseEventsTable =
  import.meta.env.VITE_SUPABASE_EVENTS_TABLE || 'events';
export const supabaseStudyPlansTable =
  import.meta.env.VITE_SUPABASE_STUDY_PLANS_TABLE || 'study_plans';
export const supabaseSchedulesTable =
  import.meta.env.VITE_SUPABASE_SCHEDULES_TABLE || 'schedules';
export const supabaseCalendarsTable =
  import.meta.env.VITE_SUPABASE_CALENDARS_TABLE || 'calendars';
export const supabaseActivitiesTable =
  import.meta.env.VITE_SUPABASE_ACTIVITIES_TABLE || 'activities';
export const supabaseGalleryTable =
  import.meta.env.VITE_SUPABASE_GALLERY_TABLE || 'photo_gallery';
export const supabaseAdvisorResourcesTable =
  import.meta.env.VITE_SUPABASE_ADVISOR_RESOURCES_TABLE || 'advisor_resources';
export const supabaseAcademicAdvisingTable =
  import.meta.env.VITE_SUPABASE_ACADEMIC_ADVISING_TABLE || 'academic_advising';
export const supabaseRegistrationVideosTable =
  import.meta.env.VITE_SUPABASE_REGISTRATION_VIDEOS_TABLE || 'registration_videos';
export const supabaseSmartELearningTable =
  import.meta.env.VITE_SUPABASE_SMART_ELEARNING_TABLE || 'smart_elearning_videos';
export const supabaseHonorListResourcesTable =
  import.meta.env.VITE_SUPABASE_HONOR_LIST_RESOURCES_TABLE || 'honor_list_resources';
export const supabaseStudentResourcesTable =
  import.meta.env.VITE_SUPABASE_STUDENT_RESOURCES_TABLE || 'student_resources';
export const supabaseStudentsTable =
  import.meta.env.VITE_SUPABASE_STUDENTS_TABLE || 'students';
export const supabaseHonorListTable =
  import.meta.env.VITE_SUPABASE_HONOR_LIST_TABLE || 'student_honor_list_documents';
export const supabaseAdvisorStudentConversationsTable =
  import.meta.env.VITE_SUPABASE_ADVISOR_STUDENT_CONVERSATIONS_TABLE || 'advisor_student_conversations';
export const supabaseConversationMessagesTable =
  import.meta.env.VITE_SUPABASE_CONVERSATION_MESSAGES_TABLE || 'conversation_messages';

export const supabaseNewsImagesBucket =
  import.meta.env.VITE_SUPABASE_NEWS_IMAGES_BUCKET || 'news-images';
export const supabaseEventImagesBucket =
  import.meta.env.VITE_SUPABASE_EVENT_IMAGES_BUCKET || 'event-images';
export const supabaseStudyPlanFilesBucket =
  import.meta.env.VITE_SUPABASE_STUDY_PLAN_FILES_BUCKET || 'study-plan-files';
export const supabaseScheduleFilesBucket =
  import.meta.env.VITE_SUPABASE_SCHEDULE_FILES_BUCKET || 'schedule-files';
export const supabaseCalendarFilesBucket =
  import.meta.env.VITE_SUPABASE_CALENDAR_FILES_BUCKET || 'calendar-files';
export const supabaseActivityImagesBucket =
  import.meta.env.VITE_SUPABASE_ACTIVITY_IMAGES_BUCKET || 'activity-images';
export const supabaseGalleryImagesBucket =
  import.meta.env.VITE_SUPABASE_GALLERY_IMAGES_BUCKET || 'gallery-images';
export const supabaseResourcesFilesBucket =
  import.meta.env.VITE_SUPABASE_RESOURCES_FILES_BUCKET || 'resources-files';
export const supabaseHonorListBucket =
  import.meta.env.VITE_SUPABASE_HONOR_LIST_BUCKET || 'honor-list-files';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
