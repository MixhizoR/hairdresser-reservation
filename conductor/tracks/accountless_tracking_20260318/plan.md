# Implementation Plan: Accountless Appointment Tracking

## Phase 1: Database & Service Layer Updates [checkpoint: 31277c5]
- [x] Task 1.1: Update `server/prisma/schema.prisma` to add `deviceToken` (String, nullable) and `trackingCode` (String, unique, nullable) to the `Appointment` model. Generate a migration (`npx prisma migrate dev --name add_tracking_fields`). f855f9e
- [x] Task 1.2: Write failing unit tests for `db.service.js` to ensure appointment creation generates and returns a UUIDv4 `deviceToken` and a 6-character alphanumeric `trackingCode`. eacedd3
- [x] Task 1.3: Implement the `deviceToken` and `trackingCode` generation logic in `db.service.js` during appointment creation to make the tests pass. eacedd3
- [x] Task 1.4: Write failing unit tests for new methods in `db.service.js` that fetch appointments by `trackingCode` and `deviceToken`. 514ce4f
- [x] Task 1.5: Implement the fetch methods in `db.service.js` to pass the tests. 514ce4f

## Phase 2: Backend API Endpoints (TDD) [checkpoint: c230c1a]
- [x] Task 2.1: Write failing integration tests for `POST /api/appointments` to verify it returns `deviceToken` and `trackingCode` in the response payload. e90e70d
- [x] Task 2.2: Update `appointment.controller.js` `createAppointment` to include the generated tokens in the JSON response. Ensure tests pass. e90e70d
- [x] Task 2.3: Write failing tests for a new public endpoint `GET /api/appointments/track`. Tests must verify: 
    - Fetching by `trackingCode` query parameter.
    - Fetching by `deviceToken` header/query.
    - Rate limiting is applied.
    - Data masking is strictly enforced (name masked, phone/notes hidden). 7dde273
- [x] Task 2.4: Implement the `GET /api/appointments/track` endpoint in `appointment.controller.js` and register it in `appointment.routes.js` with the existing `rateLimit.middleware.js`. Make all tests pass. 7dde273

## Phase 3: Frontend Booking Flow Updates
- [x] Task 3.1: Write failing tests for the frontend booking submission flow, verifying that a received `deviceToken` is securely stored in `localStorage` (`bookedAppointments` or similar key). 916df0f
- [x] Task 3.2: Update the booking submission logic in `HomePage.jsx` (or the booking component) to store the `deviceToken` after a successful booking. 916df0f
- [~] Task 3.3: Update the booking success UI to prominently display the `trackingCode`.
- [ ] Task 3.4: Integrate a QR Code generator (e.g., `qrcode.react`) to display a scannable QR code on the success screen pointing to `/track/:trackingCode` (Note: Update `tech-stack.md` if adding a new dependency per workflow rules).

## Phase 4: Frontend Status Dashboard
- [ ] Task 4.1: Write failing tests for a new `StatusPage` component, verifying it automatically reads `deviceToken` from `localStorage` on mount and displays a loading state.
- [ ] Task 4.2: Implement `StatusPage.jsx` and its route (`/track` or `/appointment-status`). Implement the `useEffect` hook to automatically fetch and display appointments using the stored `deviceToken`.
- [ ] Task 4.3: Implement a manual tracking input form within `StatusPage` that accepts a 6-character `trackingCode` and fetches the specific appointment.
- [ ] Task 4.4: Add Socket.io client listeners in `StatusPage` to receive real-time appointment status updates and dynamically refresh the UI when a barber approves/rejects/completes an appointment.

## Phase 5: Verification & Polish
- [ ] Task 5.1: Manually test the complete flow: Book an appointment, verify local storage, check status dashboard, update status as admin, verify real-time dashboard update.
- [ ] Task 5.2: Ensure the dashboard works correctly across mobile and desktop views, maintaining the "Midnight Gold" design language.
- [ ] Task 5.3: Run full test suites (`npm test` on both client and server) and verify code coverage is >80%.
