# Implementation Plan: Bug Fixes & UI Improvements

## Phase 1: Backend Alignment & API Fixes

- [x] **Task 1.1: Align User Level Validation with Prisma Enum** (2492714)
  - **File:** `server/src/controllers/user.controller.js`
  - **Action:** Update validation to use Prisma `Level` enum, ensuring `MASTER` is accepted.

- [ ] **Task 1.2: Ensure Service Delete is Soft Delete**
  - **File:** `server/src/controllers/service.controller.js`
  - **Action:** Confirm `DELETE` handler uses `isActive: false` and returns correct Turkish message.

- [ ] **Task 1.3: Fix Break Appointment Service Validation**
  - **File:** `server/src/controllers/appointment.controller.js`
  - **Action:** Add guard for `MOLA` service to bypass catalog validation; ensure overlap detection works.

## Phase 2: Admin Panel - Services Management

- [ ] **Task 2.1: Remove `isActive` Column from Services Table**
  - **File:** `client/src/pages/admin/Services.jsx`
  - **Action:** Remove "Durum" column and associated rendering.

- [ ] **Task 2.2: Remove `isActive` Toggle from Service Forms**
  - **File:** `client/src/components/admin/ServiceForm.jsx`
  - **Action:** Remove `isActive` input and state from Add/Edit forms.

- [ ] **Task 2.3: Update Delete Confirmation Text**
  - **File:** `client/src/pages/admin/Services.jsx`
  - **Action:** Change text to "Bunu silmek istiyor musunuz?".

## Phase 3: Admin Panel - Barber Form Level Dropdown

- [ ] **Task 3.1: Fix Level Dropdown Options**
  - **File:** `client/src/components/admin/BarberForm.jsx`
  - **Action:** Remove `DIRECTOR`, add `MASTER` (Usta), ensure uppercase values.

## Phase 4: Admin Panel - BreakModal Fixes

- [ ] **Task 4.1: Implement 24-Hour Time Inputs**
  - **File:** `client/src/components/admin/BreakModal.jsx`
  - **Action:** Replace time picker with separate Hour/Minute dropdowns (00/30).

- [ ] **Task 4.2: Calculate `customDuration` and Fix Payload**
  - **File:** `client/src/components/admin/BreakModal.jsx`
  - **Action:** Calculate duration, build payload per contract (no `serviceId`).

- [ ] **Task 4.3: Add Client-Side Overlap Check**
  - **File:** `client/src/components/admin/BreakModal.jsx`
  - **Action:** Fetch appointments and check for overlaps before submission.

## Phase 5: Booking Flow - Slot Logic & Localization

- [ ] **Task 5.1: Mathematical Slot Calculation**
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Calculate `requiredSlots` based on 30min slots.

- [ ] **Task 5.2: Visual Multi-Slot Blocking**
  - **File:** `client/src/components/booking/TimeSlotSelector.jsx`
  - **Action:** Render merged blocks for multi-slot appointments.

- [ ] **Task 5.3: Client-Side Overlap Validation**
  - **File:** `client/src/components/booking/TimeSlotSelector.jsx`
  - **Action:** Validate availability for ALL required slots before selection.

- [ ] **Task 5.4: Localize Duration Label**
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Change `min` to `dk`.

## Phase 6: Barber Panel Calendar - Merged Slot Rendering

- [ ] **Task 6.1: Render Multi-Slot Appointments as Merged Blocks**
  - **File:** `client/src/components/barber/BarberCalendar.jsx`
  - **Action:** Compute `slotSpan` and render unified blocks covering multiple slots.
