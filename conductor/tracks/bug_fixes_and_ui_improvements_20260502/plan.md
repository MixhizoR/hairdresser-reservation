# Implementation Plan: Bug Fixes & UI Improvements

## Phase 1: Backend Alignment & API Fixes [checkpoint: b939c60]

- [x] **Task 1.1: Align User Level Validation with Prisma Enum** (2492714)
  - **File:** `server/src/controllers/user.controller.js`
  - **Action:** Update validation to use Prisma `Level` enum, ensuring `MASTER` is accepted.

- [x] **Task 1.2: Ensure Service Delete is Soft Delete** (Existing)
  - **File:** `server/src/controllers/service.controller.js`
  - **Action:** Confirm `DELETE` handler uses `isActive: false` and returns correct Turkish message.

- [x] **Task 1.3: Fix Break Appointment Service Validation** (6877a8a)
  - **File:** `server/src/controllers/appointment.controller.js`
  - **Action:** Add guard for `MOLA` service to bypass catalog validation; ensure overlap detection works.

## Phase 2: Admin Panel - Services Management [checkpoint: 57264f8]

- [x] **Task 2.1: Remove `isActive` Column from Services Table** (Existing)
  - **File:** `client/src/pages/admin/ServicesPage.jsx`
  - **Action:** Remove "Durum" column and associated rendering.

- [x] **Task 2.2: Remove `isActive` Toggle from Service Forms** (Existing)
  - **File:** `client/src/pages/admin/ServicesPage.jsx`
  - **Action:** Remove `isActive` input and state from Add/Edit forms.

- [x] **Task 2.3: Update Delete Confirmation Text** (Existing)
  - **File:** `client/src/pages/admin/ServicesPage.jsx`
  - **Action:** Change text to "Bunu silmek istiyor musunuz?".

## Phase 3: Admin Panel - Barber Form Level Dropdown [checkpoint: 57264f8]

- [x] **Task 3.1: Fix Level Dropdown Options** (Existing)
  - **File:** `client/src/pages/admin/StylistsPage.jsx`
  - **Action:** Remove `DIRECTOR`, add `MASTER` (Usta), ensure uppercase values.

## Phase 4: Admin Panel - BreakModal Fixes [checkpoint: 57264f8]

- [x] **Task 4.1: Implement 24-Hour Time Inputs** (Existing)
  - **File:** `client/src/pages/admin/AppointmentsPage.jsx`
  - **Action:** Replace time picker with separate Hour/Minute dropdowns (00/30).

- [x] **Task 4.2: Calculate `customDuration` and Fix Payload** (Existing)
  - **File:** `client/src/pages/admin/AppointmentsPage.jsx`
  - **Action:** Calculate duration, build payload per contract (no `serviceId`).

- [x] **Task 4.3: Add Client-Side Overlap Check** (Existing)
  - **File:** `client/src/pages/admin/AppointmentsPage.jsx`
  - **Action:** Fetch appointments and check for overlaps before submission.

## Phase 5: Booking Flow - Slot Logic & Localization [checkpoint: 57264f8]

- [x] **Task 5.1: Mathematical Slot Calculation** (57264f8)
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Calculate `requiredSlots` based on 30min slots.

- [x] **Task 5.2: Visual Multi-Slot Blocking** (Existing)
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Render merged blocks for multi-slot appointments.

- [x] **Task 5.3: Client-Side Overlap Validation** (57264f8)
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Validate availability for ALL required slots before selection.

- [x] **Task 5.4: Localize Duration Label** (Existing)
  - **File:** `client/src/pages/BookingPage.jsx`
  - **Action:** Change `min` to `dk`.

## Phase 6: Barber Panel Calendar - Merged Slot Rendering [checkpoint: 57264f8]

- [x] **Task 6.1: Render Multi-Slot Appointments as Merged Blocks** (Existing)
  - **File:** `client/src/pages/barber/BarberPanel.jsx`
  - **Action:** Compute `slotSpan` and render unified blocks covering multiple slots.
