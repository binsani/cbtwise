

# Full Laravel Clone Prompt for CBTWise

This isn't an implementation task for this project — it's a request for a comprehensive prompt to recreate this app in Laravel. Here's the complete prompt you can use:

---

## Prompt for Building CBTWise in Laravel

```text
Build a full-featured CBT (Computer-Based Test) exam preparation web application 
called "CBTWise" using Laravel 11, Blade/Livewire (or Inertia.js + React), 
Tailwind CSS, and MySQL/PostgreSQL. The domain is cbtwise.com.ng.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. AUTHENTICATION & AUTHORIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Standard email/password signup & login (Laravel Breeze or Fortify)
- Email verification, forgot/reset password flows
- Role system with a separate `user_roles` table (enum: admin, moderator, user)
- Admin middleware that checks the `user_roles` table (NOT a column on users)
- Purchase code login: students enter a pre-generated code (format CBT-XXXX-XXXX-XXXX)
  which auto-creates their account using pre-assigned credentials
  (email: sanitized_name@cbtwise.com.ng, random 10-char password)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. DATABASE SCHEMA (migrations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tables:
- users (default Laravel)
- profiles: user_id (FK), full_name, phone, target_exam, avatar_url
- user_roles: user_id (FK), role (enum: admin/moderator/user), unique(user_id, role)
- exams: name, slug (unique), description, color, is_active (default true)
- subjects: exam_id (FK→exams), name, slug, is_active, topic_count, question_count
- questions: exam_id (FK→exams), subject_id (FK→subjects), text, options (JSON array 
  of strings), correct_index (int 0-4), explanation, topic, year (nullable int), 
  difficulty (easy/medium/hard), source, is_active (default true)
- user_attempts: user_id (FK), exam_slug, subject, mode (practice/study/mock), 
  total_questions, correct_answers, score_percent, time_spent_seconds, 
  answers (JSON), completed_at
- subscriptions: user_id (FK), plan, status (active/expired/cancelled), 
  starts_at, ends_at, payment_reference
- purchase_codes: code (unique), status (active/used/cancelled), duration_days, 
  assigned_name, assigned_email, assigned_password, notes, created_by (FK), 
  used_by (FK nullable), used_at (nullable)
- contact_messages: name, email, message
- question_reports: user_id (FK), exam_slug, subject, question_text, reason, 
  details, status (pending/reviewed/resolved), admin_notes, resolved_at
- admin_notifications: title, message, type (report/signup/contact), 
  reference_id, is_read (default false)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. PUBLIC PAGES (Guest)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Landing page: hero section, benefits, how it works, exam cards, pricing teaser, 
  testimonials, FAQ preview, CTA
- /pricing — plan comparison (Free: 20 questions/day, 3 mocks/month vs Premium)
- /about, /contact (stores to contact_messages + creates admin_notification), 
  /faq, /terms, /privacy
- Responsive header with nav links + auth-aware buttons
- Footer with links

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. STUDENT DASHBOARD (auth required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Stats: total tests, average score, total hours, streak (consecutive days)
- Recent tests list with scores and relative timestamps
- Weak subjects (bottom 3 by average score)
- Free-plan usage bars (daily questions used / 20, monthly mocks used / 3)
- Onboarding CTA if no attempts yet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. EXAM FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
a) Exam Selection: grid of active exams
b) Mock Exam Setup page (/mock-setup?exam=slug):
   - Select exam type, mode (practice/study/mock), subjects (checkboxes, 
     min 4 for mock, min 1 for practice/study), year filter, question count 
     (10-200), duration (15min-3hr), shuffle toggles
   - Session summary card, start button with validation
c) Three exam modes:
   - Practice Mode: answer questions one at a time, instant feedback + explanation
   - Study Mode: view questions with answers/explanations revealed, navigation only
   - Mock Exam (CBT): timed exam with subject tabs, question grid sidebar, 
     flag questions, on-screen calculator, no feedback until submit
d) Question fetching: edge function equivalent — fetch from `questions` table 
   by subject slug + exam slug, randomize, return as JSON API endpoint
e) Results page: score, percentage, pass/fail grade, subject breakdown, 
   links to dashboard/retake/analytics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. SUBSCRIPTION / FREEMIUM GATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Free tier: 20 practice questions/day, 3 mock exams/month
- Premium: unlimited (check `subscriptions` table for active + not expired)
- Show upgrade gate when limits reached
- Subscription created via purchase code redemption or manual admin assignment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PROFILE & ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Profile page: view/edit name, phone, target exam
- Analytics page: overall average, best subject, recent score trend, 
  per-subject performance with trend indicators, streak count

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. ADMIN PANEL (admin role required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sidebar layout with these sections:

a) Dashboard/Overview: key stats (users, questions, active subs, recent signups)
b) Questions Management:
   - CRUD questions with exam/subject/topic/difficulty/year fields
   - Options stored as JSON array, correct_index as integer
   - CSV bulk import with validation + template download
   - AI question generation (call AI API with exam/subject/topic/difficulty/count, 
     parse structured output, insert to DB)
   - Bulk select + delete
c) Exams & Subjects: CRUD for exams and their subjects
d) Users: list, search, view user details
e) Subscriptions: list with search + status filter, status badges
f) Analytics: platform-wide stats
g) Messages: view contact form submissions
h) Reports: view question reports from users, update status + admin notes
i) Purchase Codes:
   - Generate single or bulk codes with student name input
   - Auto-generate email (name@cbtwise.com.ng) and random password
   - Preset duration buttons (30/90/180/365 days) + custom input
   - Confirmation step showing summary before generating
   - CSV export with name/email/password/code/duration/status
   - Cancel codes, copy-to-clipboard, show/hide passwords
j) Notifications: realtime bell with unread count, sound alert, 
   browser notifications, mark all read

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. PURCHASE CODE REDEMPTION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Login page has two tabs: standard login + purchase code entry
- On code submit: validate format (CBT-XXXX-XXXX-XXXX), look up code, 
  check status=active, check assigned credentials exist, verify email not 
  already registered, create user with assigned_email/password, 
  create subscription (duration_days from code), mark code as used, 
  auto-login and redirect to dashboard
- Display credentials to user with copy buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. DESIGN & UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tailwind CSS with custom design tokens:
  - Primary: green (#22c55e-ish), dark backgrounds for dark mode
  - Fonts: Space Grotesk (headings), DM Sans (body)
  - Exam-specific colors (UTME=blue, WAEC=green, NECO=purple)
- Fully responsive (mobile hamburger menu)
- Framer Motion-style page transitions (fade/slide)
- Toast notifications for all actions (success/error)
- Dark mode support via CSS variables

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. LARAVEL-SPECIFIC IMPLEMENTATION NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use Laravel 11 with Blade + Livewire (or Inertia.js + React if SPA preferred)
- API endpoints for question fetching (JSON responses for exam modes)
- Use Laravel Policies for authorization
- Eloquent models with relationships (Exam hasMany Subjects, Subject hasMany Questions, etc.)
- Form Requests for validation
- Database seeders for sample exams, subjects, and questions
- Queue jobs for: admin notification creation on signup/contact/report
- Use Laravel's built-in auth scaffolding (Breeze) extended with purchase code flow
- Scheduled command to expire subscriptions past ends_at
- Store question options as JSON cast on the Question model
- Use Tawk.to embed script for live chat widget
```

---

This prompt covers every feature, table, page, and flow in your current CBTWise application. You can paste it directly into any Laravel-focused AI tool or hand it to a developer.

