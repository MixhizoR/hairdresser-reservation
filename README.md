# HairMan Studio | Premium Reservation System

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

HairMan Studio is an ultra-luxury reservation management system with real-time notifications, designed for a high-end barber experience. Developed with a "Midnight Gold" design language, this application provides a first-class digital experience for both customers and staff.

---

**Available Languages:**
- [English (Current)](README.md)
- [Turkish / Türkçe](README.tr.md)

---

## Features

- **Luxury Visuals**: "Midnight Gold" theme, Cinzel typography, and deep glassmorphism effects.
- **Military-Grade Security**: JWT (JSON Web Token) authentication, Helmet xss/csrf protection, and dynamic CORS restrictions.
- **Intelligent Rate Limiting**: Flexible limits in Development (Dev) mode and strict Brute-force protection in Production (Prod) mode.
- **Bot Protection**: "Honeypot" mechanism silently blocks spam reservations.
- **SQLite & Prisma ORM**: File-based, ultra-fast, and reliable database architecture without external server requirements.
- **Real-Time Dashboard**: Socket.io integration ensures new appointments and status updates are synchronized instantly.
- **Multi-Channel Audio**: Premium notifications using Web Audio API (Digital Synthesizer) or custom `.mp3` files.
- **100% Mobile Responsive**: Seamless design across all screen sizes with modern grid structures.
- **3-Stage Appointment Flow**:
  - 🟢 **Available**: Open slots ready for booking.
  - 🟠 **Pending**: Customer request received, awaiting barber approval.
  - 🔴 **Booked/Approved**: Confirmed appointments.
- **Advanced Logging**: Structured JSON logging system for debugging and system monitoring.

## Quick Start

1.  **Install Dependencies**:
    ```bash
    npm run install-all
    ```
2.  **Initialize Database**:
    ```bash
    cd server
    npm run db:migrate
    npm run db:seed
    cd ..
    ```
3.  **Run Application**:
    *   **Development Mode (Hot-Reload, API Proxy):** Run `start-dev.bat`. API requests are automatically proxied to the backend.
    *   **Production Mode (Production Build, Strict Security):** Run `start-prod.bat`.

## Tech Stack

- **Frontend**: React (Vite) + Framer Motion + Lucide Icons
- **Backend**: Node.js + Express + JWT (Bcrypt Auth) + Socket.io
- **Database**: SQLite3 + Prisma ORM
- **Security**: Helmet.js, Express-Rate-Limit, CORS Protection, Validator.js
- **Styling**: Modern Vanilla CSS (Custom Design System)

---
*Developed by: Oğuz Selman Çetin | 2026*
