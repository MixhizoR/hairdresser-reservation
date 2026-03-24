# Specification: Backend Infrastructure Overhaul (MPv3)

## Overview
Implement the complete backend roadmap defined in `MASTER_PLAN_v3.md`. This involves removing real-time dependencies (Socket.io), enhancing security, refactoring controllers, and updating the database schema to support the new service-based booking system.

## Goals
1.  **Simplify Communication**: Remove Socket.io in favor of polling.
2.  **Enhance Security**: Fix CORS, implement rate limiting on bookings, and secure tracking codes.
3.  **Refactor for Scale**: Move business logic to controllers, implement centralized error handling, and structured logging.
4.  **Database Evolution**: Update Prisma schema with `Service`, `BarberSchedule`, and `Barber` enhancements.
5.  **Core Logic Fixes**: Implement soft deletes, duration-based slot blocking, and dashboard analytics.

## Functional Requirements (Phases 1-21 of MPv3)

### 1. Security & Middleware
- **CORS**: Allow DELETE and OPTIONS methods; handle preflight requests.
- **Rate Limiting**: Move `appointmentLimiter` to POST `/api/appointments` and add `trackLimiter`.
- **Logging**: Implement `requestLogger` middleware using Winston.
- **Error Handling**: Add a centralized error handler in `app.js`.
- **Environment**: Add startup validation for required variables (DATABASE_URL, JWT_SECRET, etc.).

### 2. Socket.io Removal
- Delete `socket.js`.
- Remove all `io.emit` calls from controllers.
- Revert `server.js` to use `app.listen` instead of `http.createServer`.

### 3. Database & Prisma
- **Schema Update**:
    - `Service` model: name, price, duration (min), category, isActive.
    - `Barber` model enhancements: `photoUrl`, `level`, `speciality`.
    - `BarberSchedule` model: weekly hours.
    - `Appointment` model: link to `Service` and soft-delete support.
- **Migrations**: Run `npx prisma migrate dev`.
- **Seeding**: Fix hardcoded passwords in `seed.js`.

### 4. Controller Refactoring & Logic
- **Services CRUD**: Implement full GET/POST/PATCH/DELETE for the new `Service` model.
- **Barber Controller**: Move all barber-related logic from routes to a new `barber.controller.js`.
- **Dashboard**: Move analytics logic to `admin.controller.js` and optimize with `Promise.all`.
- **Slot Blocking**: Implement duration-based conflict detection (not just start-time).
- **Soft Deletes**: Update appointment/barber deletion to use `status: 'cancelled'` or `isActive: false`.
- **Tracking Codes**: Use `crypto` for cryptographically secure 6-char codes.

### 5. File Uploads
- Configure `multer` for barber photo uploads to `uploads/barbers/`.
- Serve the `uploads/` directory statically.

## Non-Functional Requirements
- **Performance**: Use `Promise.all` for parallel database queries where possible.
- **Reliability**: Soft deletes to prevent data loss.
- **Maintainability**: Clear separation between routes, controllers, and database services.

## Acceptance Criteria
- [ ] Backend starts without Socket.io and passes startup validation.
- [ ] CORS allows DELETE/OPTIONS from the frontend.
- [ ] Prisma migration completes successfully.
- [ ] Services API supports full CRUD.
- [ ] Bookings correctly block slots based on service duration.
- [ ] Delete operations correctly perform "soft deletes".
