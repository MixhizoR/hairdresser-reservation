# Plan: Hairdresser Reservation UI Fixes

## Changes Overview

### 1. Remove "uzman" text below stylist name on LandingPage
**File:** `client/src/pages/LandingPage.jsx` (line 98)

The `BarberCard` component shows the level text twice:
- Line 89-93: Badge on the photo's top-left corner (KEEP THIS)
- Line 98: Text below the name in the glass overlay (REMOVE THIS)

**Change:** Remove line 98: `<p className="text-xs text-on-surface-variant">{LEVEL_TR[barber.level] || LEVEL_TR.SENIOR}</p>`

Also remove the same duplicate text in `BookingPage.jsx` (line 422) where barber cards in step 2 show the level below the name.

---

### 2. Fix admin dashboard mobile responsiveness
**File:** `client/src/pages/admin/DashboardPage.jsx`

Issues:
- Hero card number `text-5xl` is too large on mobile
- StatCard uses `text-3xl` for values and `rounded-[2rem]` padding which takes too much space
- MonthlyRevenueChart bar min-width of 18px causes overflow on small screens

**Changes:**
- Hero card: reduce number from `text-5xl` to `text-4xl sm:text-5xl`, reduce padding from `p-6` to `p-4 sm:p-6`
- StatCard: reduce value from `text-3xl` to `text-2xl sm:text-3xl`, reduce padding from `p-5` to `p-3 sm:p-5`, reduce border radius from `rounded-[2rem]` to `rounded-2xl sm:rounded-[2rem]`
- MonthlyRevenueChart: reduce bar min-width from `min-w-[18px]` to `min-w-[12px]`, reduce chart height from `h-32` to `h-24 sm:h-32`, reduce container padding
- Recent appointments section: reduce padding on mobile

---

### 3. Booking page: time slots 08:30-19:00, disable past times
**File:** `client/src/pages/BookingPage.jsx`

Changes:
- Default fallback time range (line 177-182): change from `09:00-18:00` to `08:30-19:00`
- For configured operating hours, ensure the logic respects 08:30 start
- Add logic to disable time slots that are in the past when the selected date is today

**Implementation:**
- After generating `times` array, add a check: if `form.date` equals today's date, filter/disable slots before current time
- Add a new CSS class or reuse `.taken` style for past-time slots
- In the time slot rendering, add a check: `const isPastTime = form.date === todayStr && t < currentTimeSlot`

---

### 4. Barber panel: 24-hour time format
**File:** `client/src/pages/barber\BarberPanel.jsx`

The `AppointmentCard` component (line 390) uses:
```js
const timeStr = new Date(appt.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
```

This produces AM/PM format. Change to 24-hour:
```js
const timeStr = new Date(appt.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
```

Also change the date locale from 'en-US' to 'tr-TR' for consistency (line 391).

---

### 5. Auto-reject past pending appointments (server-side)
**File:** `server/src/controllers/appointment.controller.js`

Add auto-rejection logic in the `getAppointments` function. When fetching appointments, automatically reject any pending appointments whose time has passed.

**Implementation:**
- In `getAppointments` (line 34), after fetching appointments from DB, iterate through results
- For any appointment with `status === 'pending'` and `new Date(appt.time) < new Date()`, call `db.updateAppointment(appt.id, { status: 'rejected' })`
- Update the in-memory result so the response reflects the change immediately
- Also add this logic in `getAvailability` to prevent showing past pending slots as taken

Alternatively, add a dedicated cleanup function that runs on each appointment fetch to avoid N+1 queries. Use a single Prisma updateMany call:
```js
await prisma.appointment.updateMany({
  where: { status: 'pending', time: { lt: new Date() } },
  data: { status: 'rejected' }
});
```

This is more efficient. Add it at the top of `getAppointments` and `getAvailability`.

---

## File Change Summary

| File | Changes |
|------|---------|
| `client/src/pages/LandingPage.jsx` | Remove level text from BarberCard glass overlay (line 98) |
| `client/src/pages/BookingPage.jsx` | Remove level text from barber card (line 422), change default time range to 08:30-19:00, add past-time disabling |
| `client/src/pages/admin/DashboardPage.jsx` | Scale down StatCard, hero card, and chart for mobile |
| `client/src/pages/barber/BarberPanel.jsx` | Change time format to 24-hour (line 390-391) |
| `server/src/controllers/appointment.controller.js` | Add auto-reject for past pending appointments |

## Verification
- Check that the landing page still shows the level badge on the photo but not below the name
- Check that the dashboard stat cards fit on a 320px wide screen
- Check that booking page shows slots from 08:30 to 19:00 and past times are disabled for today
- Check that barber panel shows times in 24-hour format (e.g., "14:30" instead of "02:30 PM")
- Check that past pending appointments are auto-rejected when appointments are fetched
