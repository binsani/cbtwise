

## Fix "Take Mock Exam" Button on Dashboard

**Problem**: The "Take Mock Exam" button links to `/mock-exam` (the raw exam engine) instead of `/mock-setup` (the configuration page). This means users land on the exam page with no exam/subjects/time configured, likely causing errors or empty states.

**Fix**: Change the link from `/mock-exam` to `/mock-setup` in `src/pages/Dashboard.tsx` (line ~143).

This is a one-line change — update the `Link to` prop from `/mock-exam` to `/mock-setup`.

