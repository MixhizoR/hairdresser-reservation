# Track Spec: Accountless Appointment Tracking

## Objective
Enable customers to track their appointment status (Pending, Approved, Rejected, Completed) securely and easily without creating an account or using paid notification services (SMS/OTP).

## Core Requirements

1. **Automated Persistence & Zero-Friction Handoff**: Upon successful booking, the backend must generate two distinct identifiers: a secure, high-entropy `deviceToken` and a human-friendly, 6-character `trackingCode` (e.g., K9X-B22). The `deviceToken` must be automatically stored in the user's browser `localStorage`. The success screen must display the `trackingCode` alongside a scannable QR Code containing the direct tracking URL.

2. **Status Dashboard**: A new public route `/appointment-status` (or `/track`) will allow users to view the real-time status of their appointments.

3. **Frictionless Auto-Lookup**: When visiting the status dashboard, the React frontend must automatically check `localStorage` for a valid `deviceToken`. If found, it will silently authenticate the device and display all active appointments linked to that token without requiring any manual input.

4. **Manual & Cross-Device Tracking**: For users switching devices (e.g., booking on a PC, checking on a phone), the system must allow manual entry of the 6-character `trackingCode`. Alternatively, scanning the QR code provided at checkout should route the user directly to their specific tracking page (e.g., `/track/K9X-B22`).

5. **Secure Data Exposure (Data Masking)**: Because the status endpoint can be accessed via a shared link or short code, it must enforce strict data masking. The API must *only* expose non-sensitive information:
   - Appointment Status (Pending, Approved, Rejected, Completed)
   - Service Name
   - Appointment Date & Time
   - Barber's Display Name
   - Masked Customer Name (e.g., "O*** C***") or just initials.
   - *Strictly No*: Full customer name, phone number, email, or private notes.

## Security Considerations
- **UUID Randomness**: Use standard UUIDs (v4) to ensure they are unguessable.
- **Minimal Data Exposure**: Ensure the backend endpoint for public status check is read-only and filtered.
- **Rate Limiting**: Apply strict rate limiting to the status check endpoint to prevent automated scanning for appointment IDs.

## Tech Stack Impact
- **Backend**: New public route and controller method in the Express server.
- **Frontend**: New React route and component for the status dashboard; logic update in the booking flow.
- **Testing**: Requires Jest (Server) and Vitest (Client) setup to adhere to the TDD workflow.
