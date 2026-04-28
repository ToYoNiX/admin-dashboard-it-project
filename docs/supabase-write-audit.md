# Supabase Write Operations Audit

> **Scope:** All INSERT, UPDATE, UPSERT, DELETE, and RPC operations across the entire frontend codebase.
> **Purpose:** Feature parity audit — use this to verify a second frontend covers all write paths.

---

## Table of Contents

1. [advisor_profiles](#advisor_profiles)
2. [students](#students)
3. [news](#news)
4. [events](#events)
5. [staff](#staff)
6. [student_honor_list
_documents](#student_honor_list_documents)
7. [activities](#activities)
8. [academic_advising](#academic_advising)
9. [home_sections](#home_sections)
10. [photo_gallery](#photo_gallery)
11. [study_plans](#study_plans)
12. [schedules](#schedules)
13. [calendars](#calendars)
14. [advisor_student_conversations](#advisor_student_conversations)
15. [conversation_messages](#conversation_messages)
16. [contact_submissions](#contact_submissions)
17. [international_handbook_documents](#international_handbook_documents)
18. [honor_list_resources](#honor_list_resources)
19. [registration_videos](#registration_videos)
20. [advisor_resources](#advisor_resources)
21. [facilities_sections](#facilities_sections)
22. [smart_elearning_videos](#smart_elearning_videos)
23. [contact_information](#contact_information)
24. [student_resources](#student_resources)
25. [admission_sections](#admission_sections)
26. [important_links](#important_links)
27. [Auth & RPC](#auth--rpc)
28. [Storage Buckets](#storage-buckets)

---

## `advisor_profiles`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPDATE | `avatar_url`, `updated_at` | `uploadAdvisorAvatar()` | `authService.ts` | Avatar file upload |
| UPDATE | `full_name`, `updated_at` | `updateAdvisorProfileName()` | `authService.ts` | Profile name change |

---

## `students`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `student_id`, `full_name`, `nationality`, `college`, `major`, `team_code`, `amit`, `level`, `class_name`, `mobile`, `email`, `advisor_name`, `gpa`, `status` (default `'active'`), `created_at`, `updated_at` | `createStudent()` | `studentsService.ts` | Manual form submit |
| UPDATE | `status`, `updated_at` | `updateStudentStatus()` | `studentsService.ts` | Status toggle button |
| UPSERT | All fields except `created_at` — conflict on `student_id` | `bulkUpsertStudents()` | `studentsService.ts` | Bulk CSV import |
| DELETE + INSERT | All fields — deletes all records, re-inserts in chunks of 150 | `replaceAllStudents()` | `studentsService.ts` | Full roster replacement |

---

## `news`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `href`, `link_urls` (array), `image_url`, `image_urls` (array), `is_published` (`false`), `published_at` (`null`), `created_at`, `updated_at` | `createNews()` | `newsService.ts` | News item creation form |
| UPDATE | `title`, `description`, `href`, `link_urls`, `image_url`, `image_urls`, `updated_at` | `updateNews()` | `newsService.ts` | Edit form submit |
| DELETE | — | `deleteNews()` | `newsService.ts` | Delete button |

**Storage:** `news-images` bucket (supports multiple images per item)

---

## `events`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `day`, `month`, `time_range`, `location_name`, `href`, `image_url`, `is_published` (`false`), `published_at` (`null`), `created_at`, `updated_at` | `createEvent()` | `eventsService.ts` | Event creation form |
| UPDATE | `title`, `description`, `day`, `month`, `time_range`, `location_name`, `href`, `image_url`, `updated_at` | `updateEvent()` | `eventsService.ts` | Edit form submit |
| DELETE | — | `deleteEvent()` | `eventsService.ts` | Delete button |

**Storage:** `event-images` bucket

---

## `staff`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `title`, `first_name`, `last_name`, `email`, `department`, `position`, `speciality`, `google_scholar_link`, `display_order`, `cv_path`, `image_path`, `created_at` | `createStaffProfile()` | `staffService.ts` | Staff addition form |
| UPDATE | All fields except `id`/`created_at`, plus `updated_at` | `updateStaffProfile()` | `staffService.ts` | Edit form submit |
| UPDATE | `display_order`, `updated_at` (via `Promise.all` over multiple records) | `reorderStaffProfiles()` | `staffService.ts` | Drag-and-drop reorder |
| DELETE | — | `deleteStaffProfile()` | `staffService.ts` | Delete button |

**Storage:** `staff-images` bucket, `staff-cv` bucket

---

## `student_honor_list_documents`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPSERT | `key` (`'current'`), `file_path`, `updated_at` — conflict on `key` | `upsertHonorListDocument()` | `honorListService.ts` | PDF upload |

**Storage:** `honor-list-files` bucket

---

## `activities`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `activity_type`, `href`, `image_url`, `is_published` (`false`), `published_at` (`null`), `created_at`, `updated_at` | `createActivity()` | `activitiesService.ts` | Activity creation form |
| UPDATE | `title`, `description`, `activity_type`, `href`, `image_url`, `updated_at` | `updateActivity()` | `activitiesService.ts` | Edit form submit |
| DELETE | — | `deleteActivity()` | `activitiesService.ts` | Delete button |

**Storage:** `activity-images` bucket

---

## `academic_advising`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `file_path`, `created_at`, `updated_at` | `createAcademicAdvisingRecord()` | `academicAdvisingService.ts` | File upload |
| DELETE | — | `deleteAcademicAdvisingRecord()` | `academicAdvisingService.ts` | Delete button |

**Storage:** `resources-files` bucket (`academic-advising/` folder)

---

## `home_sections`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPSERT | `section_key` (`'about-sector'` / `'mission'` / `'vision'`), `title` (`null`), `content_text`, `image_path`, `file_path` (`null`), `updated_at` — conflict on `section_key` | `upsertHomeTextImageSection()` | `homeSectionsService.ts` | Text/image section save |
| UPSERT | `section_key` (`'sector-plan'`), `title`, `content_text` (`null`), `image_path` (`null`), `file_path`, `updated_at` — conflict on `section_key` | `upsertHomeDocumentSection()` | `homeSectionsService.ts` | Sector plan PDF upload |
| DELETE | — | `deleteHomeSection()` | `homeSectionsService.ts` | Remove section |

**Storage:** `home-images` bucket, `home-files` bucket

---

## `photo_gallery`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `image_url`, `created_at`, `updated_at` | `uploadGalleryPhoto()` | `galleryService.ts` | Photo upload |
| DELETE | — | `deleteGalleryPhoto()` | `galleryService.ts` | Delete button |

**Storage:** `gallery-images` bucket

---

## `study_plans`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `undergrad_cs_old_curriculum`, `undergrad_is_old_curriculum`, `undergrad_ai_old_curriculum`, `undergrad_cs_new_curriculum`, `undergrad_is_new_curriculum`, `undergrad_ai_new_curriculum`, `master_cs_old_curriculum`, `master_is_old_curriculum`, `master_ai_old_curriculum`, `master_cs_new_curriculum`, `master_is_new_curriculum`, `master_ai_new_curriculum`, `phd_cs_old_curriculum`, `phd_is_old_curriculum`, `phd_ai_old_curriculum`, `phd_cs_new_curriculum`, `phd_is_new_curriculum`, `phd_ai_new_curriculum`, `diploma_big_data` (array), `diploma_applied_ai` (array), `diploma_business_intelligence` (array), `is_published` (`false`), `published_at` (`null`), `created_at`, `updated_at` | `createStudyPlan()` | `studyPlansService.ts` | Study plan creation form |
| UPDATE | All fields above with selective file updates | `updateStudyPlan()` | `studyPlansService.ts` | Edit form submit |
| DELETE | — | `deleteStudyPlan()` | `studyPlansService.ts` | Delete button |

**Storage:** `study-plan-files` bucket (multi-file upload, one per curriculum slot)

---

## `schedules`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `category`, `schedule_type`, `semester`, `year`, `file_path`, `created_at`, `updated_at` | `createSchedule()` | `schedulesService.ts` | Schedule creation form |
| UPDATE | `title`, `category`, `schedule_type`, `semester`, `year`, `updated_at` | `updateSchedule()` | `schedulesService.ts` | Metadata-only edit |
| UPDATE | `title`, `category`, `schedule_type`, `semester`, `year`, `file_path`, `updated_at` | `updateScheduleWithFile()` | `schedulesService.ts` | Edit with new file upload |
| DELETE | — | `deleteSchedule()` | `schedulesService.ts` | Delete button |

**Storage:** `schedule-files` bucket

---

## `calendars`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `program_level` (`'Undergraduate'`), `year`, `file_path`, `created_at`, `updated_at` | `createCalendar()` | `calendarsService.ts` | Calendar creation form |
| UPDATE | `title`, `file_path`, `updated_at` | `updateCalendarWithFile()` | `calendarsService.ts` | Edit with new file |
| DELETE | — | `deleteCalendar()` | `calendarsService.ts` | Delete button |

**Storage:** `calendar-files` bucket

---

## `advisor_student_conversations`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `advisor_id`, `student_id`, `student_email`, `student_full_name`, `status`, `created_at`, `updated_at` | `startOrGetConversationByStudentIdentifier()` | `messagesService.ts` | Advisor initiates new conversation |
| UPDATE | `status` (reopen if closed) | `startOrGetConversationByStudentIdentifier()` | `messagesService.ts` | Advisor re-opens a closed conversation |
| UPDATE | `last_message_text`, `last_message_at`, `updated_at` | `sendConversationMessage()` | `messagesService.ts` | After each message sent |
| UPDATE | `status` (`'closed'`), `updated_at` | `closeConversation()` | `messagesService.ts` | Advisor closes conversation |

---

## `conversation_messages`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `conversation_id`, `sender_role` (`'advisor'`), `sender_id`, `message_text`, `created_at` | `sendConversationMessage()` | `messagesService.ts` | Message send button |

---

## `contact_submissions`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPDATE | `status`, `updated_at` | `updateContactSubmissionStatus()` | `contactCenterService.ts` | Status dropdown change (`new` / `reviewed` / `resolved`) |

---

## `international_handbook_documents`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPSERT | `key` (`'current'`), `title`, `file_path`, `updated_at` — conflict on `key` | `upsertInternationalHandbook()` | `internationalHandbookService.ts` | Handbook PDF upload |

**Storage:** `international-handbook-files` bucket

---

## `honor_list_resources`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `file_path`, `created_at`, `updated_at` | `createHonorListResource()` | `honorListResourcesService.ts` | File upload |
| DELETE | — | `deleteHonorListResource()` | `honorListResourcesService.ts` | Delete button |

**Storage:** `resources-files` bucket (`honor-list-resources/` folder)

---

## `registration_videos`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `source_type` (`'youtube'` or `'upload'`), `youtube_url` (or `null`), `video_path` (or `null`), `created_at`, `updated_at` | `createRegistrationVideo()` | `registrationVideosService.ts` | Resource creation form |
| DELETE | — | `deleteRegistrationVideo()` | `registrationVideosService.ts` | Delete button |

**Storage:** `resources-files` bucket (`registration-videos/` folder)

---

## `advisor_resources`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `resource_type` (`'file'` / `'video'` / `'link'`), `resource_url`, `file_path`, `duration`, `thumbnail_path`, `created_at`, `updated_at` | `createAdvisorResource()` | `advisorResourcesService.ts` | Resource creation form |
| UPDATE | All fields (selective updates) | `updateAdvisorResource()` | `advisorResourcesService.ts` | Edit form submit |
| DELETE | — | `deleteAdvisorResource()` | `advisorResourcesService.ts` | Delete button |

**Storage:** `resources-files` bucket (`resources/` folder)

---

## `facilities_sections`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `section_type` (`'must-facilities'` / `'international-students-handbook'`), `title`, `content_html`, `thumbnail_path`, `gallery_paths` (array), `created_at`, `updated_at` | `createFacilitiesSection()` | `facilitiesService.ts` | Section creation form |
| UPDATE | `title`, `content_html`, `thumbnail_path`, `gallery_paths`, `updated_at` | `updateFacilitiesSection()` | `facilitiesService.ts` | Edit form submit |
| DELETE | — | `deleteFacilitiesSection()` | `facilitiesService.ts` | Delete button |

**Storage:** `facilities-images` bucket (thumbnail + gallery array)

---

## `smart_elearning_videos`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `source_type`, `youtube_url` (or `null`), `video_path` (or `null`), `created_at`, `updated_at` | `createSmartELearningVideo()` | `smartELearningService.ts` | Resource creation form |
| DELETE | — | `deleteSmartELearningVideo()` | `smartELearningService.ts` | Delete button |

**Storage:** `resources-files` bucket (`smart-elearning/` folder)

---

## `contact_information`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPSERT | `key` (`'primary'`), `email`, `phone`, `address`, `map_link`, `updated_at` — conflict on `key` | `upsertContactInfo()` | `contactInfoService.ts` | Contact details save |

---

## `student_resources`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `category` (`'Registration Guide'` / `'Facilities Resource'` / `'Other / Untagged'`), `resource_type` (`'file'` / `'video'` / `'link'`), `resource_url`, `file_path`, `duration`, `thumbnail_path`, `created_at`, `updated_at` | `createStudentResource()` | `studentResourcesService.ts` | Resource creation form |
| UPDATE | All fields (selective updates) | `updateStudentResource()` | `studentResourcesService.ts` | Edit form submit |
| DELETE | — | `deleteStudentResource()` | `studentResourcesService.ts` | Delete button |

**Storage:** `resources-files` bucket (`resources/` folder)

---

## `admission_sections`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| UPSERT | `section_key` (`'how-to-apply'` / `'required-documents'`), `steps` (array), `attachments` (empty array), `updated_at` — conflict on `section_key` | `upsertAdmissionStepsSection()` | `admissionService.ts` | Steps editor save |
| UPSERT | `section_key` (`'external-transfer-requirements'`), `steps` (empty array), `attachments` (array of `{ id, title, file_path, file_type }`), `updated_at` — conflict on `section_key` | `upsertExternalTransferRequirements()` | `admissionService.ts` | Transfer requirements save |

**Storage:** `admission-files` bucket

---

## `important_links`

| Operation | Fields | Function | File | Trigger |
|-----------|--------|----------|------|---------|
| INSERT | `id`, `title`, `description`, `href`, `image_path`, `created_at`, `updated_at` | `createImportantLink()` | `importantLinksService.ts` | Link creation form |
| UPDATE | `title`, `description`, `href`, `image_path`, `updated_at` | `updateImportantLink()` | `importantLinksService.ts` | Edit form submit |
| DELETE | — | `deleteImportantLink()` | `importantLinksService.ts` | Delete button |

**Storage:** `important-links-images` bucket

---

## Auth & RPC

> These do not write directly to a named table but trigger server-side state changes.

| Operation | Parameters | Function | File | Trigger |
|-----------|------------|----------|------|---------|
| `supabase.auth.signUp()` | `email`, `password`, `full_name` (metadata), `invite_token` (metadata) | `signUpWithPassword()` | `authService.ts` | Invite registration page submit |
| RPC `create_advisor_invite` | `p_email`, `p_is_super_admin` → returns `invite_token` | `createAdvisorInvite()` | `advisorsAdminService.ts` | Super admin sends invite |
| RPC `revoke_advisor_access` | `p_user_id` | `revokeAdvisorAccess()` | `advisorsAdminService.ts` | Revoke access button |
| RPC `delete_advisor_account` | `p_user_id` | `deleteAdvisorAccount()` | `advisorsAdminService.ts` | Delete account button |

---

## Storage Buckets

| Bucket | Used By |
|--------|---------|
| `advisor-avatars` | Advisor profile avatar |
| `staff-images` | Staff profile photos |
| `staff-cv` | Staff CV files |
| `news-images` | News item images (multiple per item) |
| `event-images` | Event images |
| `gallery-images` | Photo gallery |
| `activity-images` | Activity images |
| `home-images` | Home section images (about, mission, vision) |
| `home-files` | Home section documents (sector-plan PDF) |
| `study-plan-files` | Study plan PDFs (one per curriculum slot) |
| `schedule-files` | Schedule PDFs |
| `calendar-files` | Calendar PDFs |
| `resources-files` | Academic advising, honor list resources, registration videos, advisor resources, student resources, smart e-learning (sub-folders per feature) |
| `facilities-images` | Facilities section thumbnails and gallery arrays |
| `important-links-images` | Important link images |
| `admission-files` | Admission transfer requirement attachments |
| `honor-list-files` | Honor list document PDF |
| `international-handbook-files` | International handbook PDF |

---

## Summary

| Metric | Count |
|--------|-------|
| Tables written to | 26 |
| Storage buckets written to | 18 |
| Total write operations | 79 |
| INSERT | 31 |
| UPDATE | 29 |
| UPSERT | 8 |
| DELETE | 8 |
| RPC | 3 |
