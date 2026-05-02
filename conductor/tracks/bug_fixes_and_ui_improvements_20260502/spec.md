# Specification: Bug Fixes & UI Improvements

## Goal
Address all frontend visual bugs, backend validation mismatches, and slot calculation logic across the Booking flow, Admin panel, and Barber panel to ensure data consistency and correct multi-slot appointment rendering.

## Success Criteria
- Barber panel calendar visually merges multi-slot appointments into single continuous blocks.
- Admin panel Services uses soft deletion with correct Turkish confirmation text; `isActive` toggle removed from table and forms.
- Admin panel BreakModal uses 24-hour time format with minute steps of 00/30 only, submits without "Invalid service selection" errors, and checks for overlapping appointments.
- Admin/Barber addition level dropdown aligns exactly with Prisma enum; `DIRECTOR` removed; `MASTER` works.
- Booking page calculates slot occupancy mathematically from `service.duration`, blocks visual slots accordingly, validates overlaps client-side before submission, and displays duration as `dk` instead of `min`.
- All existing backend tests pass; no hardcoded slot arrays remain in booking logic.

## Hard Data Contracts

### User Level Enum (Prisma)
```prisma
enum Level {
  JUNIOR
  SENIOR
  MASTER
  DIRECTOR
}
```
*Note: Frontend dropdown must map exactly to these enum strings. `DIRECTOR` is to be removed from the UI options per business requirement, but preserved in schema for legacy records.*

### Break / Blockout Appointment Payload
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

### Service Soft Delete Response
```json
{
  "success": true,
  "message": "Hizmet başarıyla silindi"
}
```

### Slot Calculation Contract
- Slot duration is strictly **30 minutes**.
- Operating hours generate slots from `08:00` to `20:30` inclusive.
- `requiredSlots = Math.ceil(service.duration / 30)`
- A 150-minute service requires **5 slots**.
