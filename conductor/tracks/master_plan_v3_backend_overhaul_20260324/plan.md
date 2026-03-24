# Implementation Plan: Backend Infrastructure Overhaul (MPv3)

## Phase 1: Security & Middleware Foundations
- [ ] Task: Update CORS configuration in `server/src/app.js` to allow DELETE/OPTIONS and preflight requests (MPv3 FIX 1).
- [ ] Task: Add `requestLogger` middleware for structured Winston logging (MPv3 FIX 13).
- [ ] Task: Implement Centralized Error Handler in `server/src/app.js` (MPv3 FIX 12).
- [ ] Task: Move `appointmentLimiter` and add `trackLimiter` in `rateLimit.middleware.js` and `appointment.routes.js` (MPv3 FIX 3).
- [ ] Task: Add Environment Variable Validation on startup in `server/src/config/env.js` (MPv3 FIX 14).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Security & Middleware' (Protocol in workflow.md)

## Phase 2: Socket.io Removal & Cleanup
- [ ] Task: Delete `server/src/socket.js` (MPv3 FIX 2).
- [ ] Task: Update `server/src/server.js` to use `app.listen` instead of `http.createServer` (MPv3 FIX 2).
- [ ] Task: Remove all socket.io references and imports from `appointment.controller.js` and other files (MPv3 FIX 2).
- [ ] Task: Uninstall `socket.io` from `package.json`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Socket.io Removal' (Protocol in workflow.md)

## Phase 3: Database & Schema Migration
- [ ] Task: Update `prisma/schema.prisma` with `Service` model, enhanced `User` (Barber) fields, and `BarberSchedule` model (MPv3 Prisma Changes).
- [ ] Task: Update `Appointment` model for soft-delete support and Service relation.
- [ ] Task: Run `npx prisma migrate dev` to apply schema changes.
- [ ] Task: Fix hardcoded password and production logging in `server/prisma/seed.js` (MPv3 FIX 15).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Database & Schema' (Protocol in workflow.md)

## Phase 4: Controller Refactoring & Logic Updates
- [ ] Task: Create `barber.controller.js` and move all logic from `barber.routes.js`, ensuring LF line endings (MPv3 FIX 11, FIX 17).
- [ ] Task: Move Dashboard analytics logic from `admin.routes.js` to `admin.controller.js` and optimize with `Promise.all` (MPv3 FIX 10).
- [ ] Task: Update `tracking code` generation to use `crypto` for security (MPv3 FIX 7).
- [ ] Task: Remove duplicate `findAppointmentByTime` in `db.service.js` (MPv3 FIX 6).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Controller Refactoring' (Protocol in workflow.md)

## Phase 5: Service Model Implementation (CRUD & Logic)
- [ ] Task: Implement `Service` CRUD in `service.controller.js` and `service.routes.js` (MPv3 NEW: Services CRUD).
- [ ] Task: Replace hardcoded `allowedServices` in `appointment.controller.js` with dynamic database lookup (MPv3 FIX 4).
- [ ] Task: Implement Service Duration Slot Blocking in `createAppointment` logic (MPv3 FIX 5).
- [ ] Task: Cache the sounds list in `system.controller.js` to improve performance (MPv3 FIX 16).
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Service Logic' (Protocol in workflow.md)

## Phase 6: Deletion Logic & Protection
- [ ] Task: Implement Soft Delete for appointments (status: 'cancelled') in `appointment.controller.js` (MPv3 FIX 8).
- [ ] Task: Implement Protection for Barber deletion (block if future appointments exist) (MPv3 FIX 9).
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Deletion Logic' (Protocol in workflow.md)

## Phase 7: File Uploads & Static Assets
- [ ] Task: Configure `multer` for barber photo uploads in `barber.controller.js` (MPv3 Photo Upload).
- [ ] Task: Set up static serving for `/uploads` in `server/src/app.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 7: File Uploads' (Protocol in workflow.md)
