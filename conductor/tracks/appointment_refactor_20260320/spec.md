# Track Spec: Appointment Status Refactor and Encoding Fix

## Overview
This track focuses on cleaning up the appointment status lifecycle and fixing a data integrity bug where special characters (like `&`) are incorrectly encoded in the database.

## Functional Requirements

### 1. Appointment Status Cleanup
- **Remove 'Completed' Status**: The `completed` status will be removed entirely from the system.
    - **Backend**: Remove from status validation lists, Prisma schema comments, and dashboard statistics logic.
    - **Frontend**: Remove from the Admin Dashboard filters, status update buttons, and the Status Dashboard translation logic.
- **Maintain 'Approved' State**: Appointments that were previously marked as `completed` will now simply remain in the `approved` state.

### 2. Character Encoding Fix
- **Remove HTML Escaping on Save**: Stop using `validator.escape()` when creating or updating appointments.
    - This fixes the issue where `&` is saved as `&amp;`.
    - Rely on Prisma's built-in parameterization for SQL injection protection.
    - Rely on React's default behavior for XSS protection during rendering.

### 3. Slot Re-application Logic
- **Slot Blocking**: Confirm and maintain the existing logic that prevents multiple appointments for the same barber/time slot if an appointment is already in any state other than `rejected`.

## Non-Functional Requirements
- **Data Integrity**: Ensure that existing data in the database is not corrupted (though some existing `&amp;` entries may need manual fix or a migration script if critical).
- **UI Consistency**: Ensure all dashboard stats and filters are updated to reflect the removal of the `completed` status.

## Acceptance Criteria
- Booking an appointment with `&` in the name or service saves it as `&` in the database.
- The 'Completed' filter and status button are gone from the Admin Panel.
- Dashboard statistics no longer show a count for 'Completed' appointments.
- Existing unit/integration tests are updated to reflect the status changes.
- `lint-and-validate` runs successfully without errors.
