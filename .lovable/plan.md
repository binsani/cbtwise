

## What's Done

- Authentication (signup, login, password reset) with auto-confirm
- Protected routes and admin RBAC guard
- Dynamic exam/subject selection from database
- Question fetching via ALOC API
- Practice mode and mock CBT exam with result persistence
- Live Dashboard and Analytics from `user_attempts`
- Profile page (view/edit)
- Contact form saving to database
- Terms and Privacy pages
- Admin dashboard and question management pages (UI only)

## What Remains

Here is what still needs work before the app is truly deploy-ready:

### 1. OG Image and Social Meta Tags
`index.html` still references the default Lovable OG image (`lovable.dev/opengraph-image-p98pqg.png`) and `@Lovable` Twitter handle. These should be replaced with CBTWise-branded assets.

### 2. Admin Dashboard — Real Data
`AdminDashboard.tsx` uses entirely hardcoded stats ("2,847 users", "456 subscribers") and fake recent activity. It should query actual counts from `profiles`, `subscriptions`, `user_attempts`, and `questions` tables.

### 3. Admin Questions — CRUD Functionality
`AdminQuestions.tsx` displays sample data and the Add/Edit/Delete buttons do nothing. It needs to:
- Fetch real questions from the `questions` table
- Support adding new questions via a form/dialog
- Support editing and deleting questions

### 4. Pricing — Payment Integration
The pricing buttons ("Start Free", "Go Premium") are non-functional. The `subscriptions` table exists but nothing writes to it. This requires Paystack/Flutterwave integration to process payments and activate subscriptions.

### 5. Subscription Gating
No logic currently enforces free-tier limits (e.g., "20 questions per day", "3 mock exams per month"). Premium features are accessible to everyone. Needs middleware to check `subscriptions` status before allowing unlimited access.

### 6. Missing Database Trigger
The `handle_new_user` function exists but the context shows "There are no triggers in the database." This means new signups may not automatically get a profile row or a `user` role, which would break dashboard/profile pages.

---

### Recommended Priority Order

1. **Fix the `handle_new_user` trigger** — critical for new signups to work
2. **Update OG image/meta tags** — quick win, important for sharing
3. **Wire Admin Dashboard to real data** — moderate effort
4. **Wire Admin Questions CRUD** — moderate-to-high effort
5. **Payment integration + subscription gating** — largest effort, can be deferred

Would you like me to start implementing these? I'd recommend tackling the trigger fix and OG meta tags first, then the admin pages.

