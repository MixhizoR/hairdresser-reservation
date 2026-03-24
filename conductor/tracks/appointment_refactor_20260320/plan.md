# Implementation Plan: Appointment Status Refactor and Encoding Fix

## Phase 1: Backend Cleanup & Encoding Fix [checkpoint: 323e9cb]
- [x] Task: Remove `completed` status from backend validation logic in `appointment.controller.js`. e07b6ac
- [x] Task: Remove `validator.escape()` from `createAppointment` in `appointment.controller.js` to fix the `&` encoding issue. 56bfef7
- [x] Task: Update `db.service.js` to remove `completed` status from dashboard statistics and any relevant query logic. 28dfdf3
- [x] Task: Update backend unit and integration tests to reflect the removal of the `completed` status. 0671f30
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Cleanup & Encoding Fix' (Protocol in workflow.md) 323e9cb

## Phase 2: Frontend Refactor
- [ ] Task: Remove 'Completed' filter and status update buttons from `AdminPage.jsx`.
- [ ] Task: Remove `completed` status translation and color coding from `App.jsx`, `HomePage.jsx`, and `StatusPage.jsx`.
- [ ] Task: Update frontend tests (Vitest) to ensure the `completed` status is no longer used or expected.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Refactor' (Protocol in workflow.md)

## Phase 3: Quality Assurance & Finalization
- [ ] Task: Run `lint-and-validate` (or equivalent linting/formatting commands) across the project.
- [ ] Task: Verify that `&` symbols are correctly saved and displayed without HTML entities.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Quality Assurance & Finalization' (Protocol in workflow.md)
