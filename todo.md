# Comprehensive Implementation Plan: HairMan Studio Bug Fixes & UI Improvements

Address all frontend visual bugs, backend validation mismatches, and slot calculation logic across the Booking flow, Admin panel, and Barber panel to ensure data consistency and correct multi-slot appointment rendering.

## Success Criteria
- [ ] Barber panel calendar visually merges multi-slot appointments into single continuous blocks.
- [ ] Admin panel Services uses soft deletion with correct Turkish confirmation text; `isActive` toggle removed from table and forms.
- [ ] Admin panel BreakModal uses 24-hour time format with minute steps of 00/30 only, submits without "Invalid service selection" errors, and checks for overlapping appointments.
- [ ] Admin/Barber addition level dropdown aligns exactly with Prisma enum; `DIRECTOR` removed; `MASTER` works.
- [ ] Booking page calculates slot occupancy mathematically from `service.duration`, blocks visual slots accordingly, validates overlaps client-side before submission, and displays duration as `dk` instead of `min`.
- [ ] All existing backend tests pass; no hardcoded slot arrays remain in booking logic.

---

## Strict File Tree & Paths
The agent must only operate on the following exact paths:
* `prisma/schema.prisma`
* `server/src/controllers/user.controller.js`
* `server/src/controllers/service.controller.js`
* `server/src/controllers/appointment.controller.js`
* `client/src/pages/admin/Services.jsx`
* `client/src/components/admin/ServiceForm.jsx`
* `client/src/components/admin/BarberForm.jsx`
* `client/src/components/admin/BreakModal.jsx`
* `client/src/pages/BookingPage.jsx`
* `client/src/components/booking/TimeSlotSelector.jsx`
* `client/src/components/barber/BarberCalendar.jsx`

---

## Specific Tooling & Versions
*   **Node.js:** v20.x LTS
*   **React:** v18.x (Vite)
*   **Prisma ORM:** v5.x
*   **Tailwind CSS:** v3.x
*   **Testing:** Vitest / React Testing Library (Frontend), Jest / Supertest (Backend)

---

## 📄 Hard Data Contracts

*   **User Level Enum (Prisma):**
    ```prisma
    enum Level {
      JUNIOR
      SENIOR
      MASTER
      DIRECTOR
    }
    ```
    *Note: Frontend dropdown must map exactly to these enum strings. `DIRECTOR` is to be removed from the UI options per business requirement, but preserved in schema for legacy records.*

*   **Break / Blockout Appointment Payload:**
    ```json
    {
      "name": "MOLA",
      "phone": "",
      "service": "MOLA",
      "barberId": "<uuid>",
      "time": "2026-05-02T08:00:00.000Z",
      "customDuration": 90,
      "status": "approved",
      "notes": "Mola / Break"
    }
    ```
    *The backend must accept this payload without validating `service` against the active `Service` catalog.*

*   **Service Soft Delete Response:**
    ```json
    {
      "success": true,
      "message": "Hizmet başarıyla silindi"
    }
    ```
    *Endpoint performs `prisma.service.update({ where: { id }, data: { isActive: false } })`.*

*   **Slot Calculation Contract:**
    *   Slot duration is strictly **30 minutes**.
    *   Operating hours generate slots from `08:00` to `20:30` inclusive.
    *   `requiredSlots = Math.ceil(service.duration / 30)`
    *   A 150-minute service requires **5 slots**. Starting at 08:00, it occupies the start times: `08:00`, `08:30`, `09:00`, `09:30`, `10:00`.

---

## Phase 1: Backend Alignment & API Fixes (Atomic Steps)

### Step 1.1: Align User Level Validation with Prisma Enum
**File:** `server/src/controllers/user.controller.js` (or dedicated barber/stylist controller)
- **How:** Locate the validation logic that throws `Geçersiz seviye. İzin verilenler: ...`.
- **Do That:**
  - Remove the hardcoded string array `['SENIOR', 'JUNIOR', 'TRAINEE']` (or whatever hardcoded list exists).
  - Replace it with dynamic validation against the Prisma `Level` enum values.
  - Ensure `MASTER` is accepted. The validation must accept any value defined in `prisma/schema.prisma` `enum Level`.

### Step 1.2: Ensure Service Delete is Soft Delete
**File:** `server/src/controllers/service.controller.js`
- **How:** Verify the `DELETE /services/:id` handler.
- **Do That:**
  - Confirm it performs `prisma.service.update({ where: { id }, data: { isActive: false } })`.
  - Confirm it does NOT use `prisma.service.delete()`.
  - Return the standardized success response defined in Hard Data Contracts.

### Step 1.3: Fix Break Appointment Service Validation
**File:** `server/src/controllers/appointment.controller.js`
- **How:** Locate the appointment creation logic and its service validation middleware.
- **Do That:**
  - Add a guard clause: `if (req.body.name === 'MOLA' && req.body.service === 'MOLA') { // bypass service catalog validation }`.
  - Ensure the overlap detection transaction still runs for MOLA appointments (they must block the calendar).
  - Ensure `customDuration` is used to calculate `endTime` for overlap checks.

---

## Phase 2: Admin Panel - Services Management (Atomic Steps)

### Step 2.1: Remove `isActive` Column from Services Table
**File:** `client/src/pages/admin/Services.jsx`
- **How:** Find the services data table.
- **Do That:**
  - Remove the table header and cell rendering for the "Durum" / "Aktif" column.
  - Remove any logic that fetches or displays `isActive` status badges.

### Step 2.2: Remove `isActive` Toggle from Service Forms
**File:** `client/src/components/admin/ServiceForm.jsx`
- **How:** Find the Add and Edit service forms.
- **Do That:**
  - Remove the `isActive` checkbox, toggle, or switch input from both forms.
  - Remove `isActive` from the form state and submit payload.
  - The database default for new services remains `isActive: true`.

### Step 2.3: Update Delete Confirmation Text
**File:** `client/src/pages/admin/Services.jsx`
- **How:** Locate the delete button handler and its confirmation dialog.
- **Do That:**
  - Change the dialog text from `"Bunu pasifleştirmek istiyor musunuz?"` to `"Bunu silmek istiyor musunuz?"`.
  - Keep the onConfirm handler calling the existing DELETE API (which performs soft delete).

---

## Phase 3: Admin Panel - Barber Form Level Dropdown (Atomic Steps)

### Step 3.1: Fix Level Dropdown Options
**File:** `client/src/components/admin/BarberForm.jsx`
- **How:** Locate the `<select>` element for stylist level.
- **Do That:**
  - Remove the `DIRECTOR` (Direktör) `<option>` entirely.
  - Ensure the remaining options map exactly to the Prisma enum:
    - Label: `Çırak` → Value: `JUNIOR`
    - Label: `Kıdemli` → Value: `SENIOR`
    - Label: `Usta` → Value: `MASTER`
  - Verify the `value` attribute of each `<option>` uses UPPERCASE strings matching the Prisma enum exactly.

---

## Phase 4: Admin Panel - BreakModal Fixes (Atomic Steps)

### Step 4.1: Implement 24-Hour Time Inputs
**File:** `client/src/components/admin/BreakModal.jsx`
- **How:** Replace any AM/PM time picker library or native `type="time"` with AM/PM behavior.
- **Do That:**
  - Use two separate `<select>` dropdowns for Hour and Minute for both Start and End times.
  - Hour dropdown: options `08`, `09`, `10`, ..., `20`.
  - Minute dropdown: options `00`, `30` only.

### Step 4.2: Calculate `customDuration` and Fix Payload
**File:** `client/src/components/admin/BreakModal.jsx`
- **How:** Find the submit handler.
- **Do That:**
  - Calculate `customDuration` in minutes from the selected start and end times: `(endHour * 60 + endMinute) - (startHour * 60 + startMinute)`.
  - Build payload exactly per Hard Data Contracts:
    ```javascript
    {
      name: "MOLA",
      phone: "",
      service: "MOLA",
      barberId: selectedBarberId,
      time: startTimeISOString,
      customDuration: calculatedDuration,
      status: "approved",
      notes: "Mola"
    }
    ```
  - Ensure NO `serviceId` or `serviceRef` field is included in the payload.

### Step 4.3: Add Client-Side Overlap Check
**File:** `client/src/components/admin/BreakModal.jsx`
- **How:** Before calling the API in the submit handler.
- **Do That:**
  - Fetch or use existing `appointments` state for the selected barber on the selected date.
  - Calculate the break's time range: `startTime` to `startTime + customDuration minutes`.
  - Check if this range overlaps with any existing appointment where `status !== 'rejected'`.
  - If overlap exists, show an alert/error: `"Seçilen saat aralığında mevcut randevu bulunmaktadır."` and `return` early without API call.

---

## Phase 5: Booking Flow - Slot Logic & Localization (Atomic Steps)

### Step 5.1: Mathematical Slot Calculation
**File:** `client/src/pages/BookingPage.jsx`
- **How:** Locate the time slot generation / availability logic.
- **Do That:**
  - Define a constant: `const SLOT_MINUTES = 30;`.
  - When a service is selected, calculate: `const requiredSlots = Math.ceil(selectedService.duration / SLOT_MINUTES);`.
  - Pass `requiredSlots` down to the time slot selector component as a prop.

### Step 5.2: Visual Multi-Slot Blocking
**File:** `client/src/components/booking/TimeSlotSelector.jsx`
- **How:** In the slot grid/map rendering logic.
- **Do That:**
  - When iterating over booked appointments, calculate `occupiedSlots = Math.ceil((appointment.customDuration || appointment.service?.duration || 30) / 30)`.
  - For the starting slot of a multi-slot appointment, render a single merged block that visually spans `occupiedSlots` rows (or columns, depending on layout).
  - Do not render the subsequent slots as separate individual blocks; they must appear as one unified appointment block.

### Step 5.3: Client-Side Overlap Validation
**File:** `client/src/components/booking/TimeSlotSelector.jsx`
- **How:** In the slot selection `onClick` handler.
- **Do That:**
  - When a user clicks slot at index `i`, check that slots `i`, `i+1`, ..., `i + requiredSlots - 1` are all unbooked and within operating hours (08:00 - 20:30).
  - If any slot in that range is booked, or if the range exceeds 20:30, display an inline error message: `"Bu saat uygun değil. Lütfen başka bir saat seçin."`
  - Prevent setting the selected time and prevent API submission.

### Step 5.4: Localize Duration Label
**File:** `client/src/pages/BookingPage.jsx`
- **How:** Find the "Seçiminiz" (Your Selection) summary sidebar.
- **Do That:**
  - Locate the string template rendering service duration.
  - Change `(${service.duration} min)` to `(${service.duration} dk)`.

---

## Phase 6: Barber Panel Calendar - Merged Slot Rendering (Atomic Steps)

### Step 6.1: Render Multi-Slot Appointments as Merged Blocks
**File:** `client/src/components/barber/BarberCalendar.jsx`
- **How:** In the calendar grid rendering mapped appointments.
- **Do That:**
  - For each appointment, compute `slotSpan = Math.ceil((appointment.customDuration || appointment.service?.duration || 30) / 30)`.
  - If `slotSpan > 1`, render the appointment as a single absolute or grid-spanned block covering `slotSpan` time slots.
  - The block must display the customer name and service name once, centered within the merged area.
  - Ensure that the occupied underlying slots are not rendered as empty/available.

---

## Forbidden Actions (Guardrails)
*   **Do NOT** modify the authentication middleware or JWT logic.
*   **Do NOT** reintroduce dynamic operating hours from the database; keep the hardcoded `08:00 - 21:00` logic.
*   **Do NOT** perform hard deletion on Services or Barbers; always use `isActive: false` soft deletion.
*   **Do NOT** refactor existing polling hooks (`useAppointmentsPolling`) outside of ensuring they fetch the data shapes needed for the new slot calculations.
*   **Do NOT** change the `completed` status logic (it has been removed per project context).
*   **Do NOT** use manual `.replace()` chaining for HTML entity sanitization; rely on the existing `sanitize-html` middleware.

---

## Verification Command
Run the following commands sequentially from the project root to prove the implementation is successful:

```bash
# 1. Backend tests
cd server && npm test

# 2. Frontend unit tests for affected public flows
cd ../client && npm test -- BookingPage.test.jsx TrackPage.test.jsx

# 3. Type-check and build verification
cd ../client && npm run build

# 4. Prisma schema validation
cd ../server && npx prisma validate
```