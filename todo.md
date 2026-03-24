# 🗺️ HairMan Studio — Explicit Execution Plan v2

Welcome to your step-by-step guide! Follow these phases strictly to build the system exactly as designed in the Master Plan. 🌟 Remember the Golden Rules for every component:
- **Font:** Manrope.
- **Icons:** Material Symbols Outlined.
- **Borders:** NO 1px solid borders. Use surface color shifts (e.g., `bg-surface-container-low` to `bg-surface-container-lowest`).
- **Rounding:** Use `rounded-[2rem]` or `rounded-full` for large components. NO standard `rounded` or `rounded-lg`.
- **Text:** NO pure black (`#000000`). Use `text-on-surface`.
- **Shadows:** Use the custom ambient shadow: `shadow-[0_20px_40px_rgba(0,96,173,0.06)]`.
- **Buttons:** Always pill-shaped (`rounded-full`).

---

## 🛠️ PHASE 1: Backend Foundation & Database 

**1. Apply the CORS Fix**
- Open `server/index.js`.
- At the **very top**, insert the `corsOptions` block provided in the plan.
- Make sure to include `app.options('*', cors(corsOptions))` to handle preflight requests.
- Ensure allowed methods are `['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']`.

**2. Setup File Uploads (Multer)**
- Run `npm install multer` in your backend directory.
- Add `app.use('/uploads', express.static('uploads'))` to `server/index.js` to serve images statically.

**3. Update Prisma Schema**
- Open `prisma/schema.prisma`.
- Create a `Service` model with fields: `id, name, description, price, duration, category, isActive, createdAt`.
- Update your existing `Barber` model to include: `photoUrl, level, speciality`.
- Run your database migration (e.g., `npx prisma db push`).

---

## 🎨 PHASE 2: Frontend Global Setup

**4. Configure `index.html`**
- Open `client/index.html`.
- Add the Tailwind CDN script: `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>`.
- Add the Google Fonts link for Manrope (weights 200 to 800).
- Add the Material Symbols Outlined link.
- Paste the exact `tailwind.config` script block provided in the Master Plan into the `<head>` to define all custom colors and border radiuses.

**5. Update Global CSS**
- Open `client/src/index.css`.
- Set the body font to Manrope: `body { font-family: 'Manrope', sans-serif; }`.
- Add the utility classes exactly as requested: `.glass-card`, `.no-scrollbar`, and `.ambient-shadow`.
- Configure the `.material-symbols-outlined` font-variation-settings.

---

## 🏗️ PHASE 3: Frontend Architecture & Best Practices

**6. Clean Up `App.jsx`**
- Remove all data fetching (like fetching appointments or barbers) from `App.jsx`.
- Keep ONLY: Routing, Authentication State (`token`, `userRole`, `currentUser`), Login/Logout handlers, and the Socket reference.

**7. Implement the Protected Route Pattern**
- Create a `ProtectedRoute` component that checks for `token` and `userRole`.
- Set it up to redirect unauthorized users to `/login` or their respective dashboards.

**8. Create Custom Data Hooks**
- In a new `src/hooks/` folder, create hooks like `useAppointments`, `useServices`, and `useBarbers`.
- Implement standard loading, error, and refresh states in these hooks to handle API calls smoothly.

**9. Fix Socket.io Listeners**
- Remove global socket listeners.
- Wrap socket event listeners (like `new_appointment`) inside `useEffect` hooks ONLY on the specific pages that need them (Admin/Barber panels).

---

## 🌍 PHASE 4: Public Customer Pages

**10. Build `LandingPage.jsx` (Route: `/`)**
- Create the sticky `Navbar` with glassmorphism (`bg-white/80 backdrop-blur-xl`).
- Build the `HeroSection` with a full-screen gradient overlay and "Book Now" pill button.
- Build the `ServicesSection` using a Bento Grid layout on a `bg-surface-container` background. Connect this to your `/api/services` endpoint.
- Build the `StylistsSection` with a 4-column grid. Images should be grayscale and turn colorful on hover.
- Add the `CTASection` at the bottom.

**11. Build `BookingPage.jsx` (Route: `/book`)**
- Build the 12-column grid layout (8 columns for steps, 4 columns for the sticky schedule).
- **Step 1:** Build the `ServiceSelector` with clickable, pill-shaped cards.
- **Step 2:** Build the `StylistSelector` using a horizontal scroll (`no-scrollbar`) and glass overlay cards.
- **Step 3:** Build the sticky `ScheduleSelector` with a mini calendar and available time slots.
- **Customer Form:** Build the `BookingConfirmModal`. Include strict validation for names and Turkish phone numbers (`/^05\d{9}$/`).
- **Crucial:** Add the hidden Honeypot input (`<input type="text" name="website" style={{display: 'none'}} />`) to block bots!

**12. Build `TrackPage.jsx` (Route: `/track`)**
- Build the appointment lookup form using the Appointment ID.
- Create the Status Timeline visual showing Pending (amber) ➔ Confirmed (blue) ➔ Completed (green) or Rejected (red).

**13. Build `LoginPage.jsx` (Route: `/login`)**
- Create a full-screen, centered login card with `ambient-shadow`.
- Add Username and Password inputs with an error banner (`bg-error-container`).
- On successful login, redirect Admin to `/admin` and Barber to `/berber`.

---

## 👔 PHASE 5: Admin Panel

**14. Build `AdminLayout.jsx`**
- Create the fixed Sidebar (width 64) with navigation links and the logout button.
- Create the sticky TopBar with the search input and notification icon.
- Ensure the `<Outlet />` is properly placed for child routes.

**15. Build `DashboardPage.jsx` (Route: `/admin`)**
- Create the Monthly Revenue Card with the blue gradient and decorative blur.
- Build the weekly bar chart and the "Today's Schedule" list view.

**16. Build `AppointmentsPage.jsx` (Route: `/admin/appointments`)**
- Create the Filter Tabs (All | Pending | Confirmed | Completed | Cancelled).
- Build the Appointment Table with specific status chips for each state.
- Create the Add/Edit Appointment Modal using the standard modal pattern.

**17. Build `ServicesPage.jsx` (Route: `/admin/services`)**
- Create top metric cards (Revenue, Active Services, Most Popular).
- Build the list of services with category chips (`BARBERING`, `GROOMING`, `TREATMENTS`).
- Build the Add/Edit Service Modal with form inputs for price, duration, and active toggle.

**18. Build `StylistsPage.jsx` (Route: `/admin/stylists`)**
- Create the Barber Grid showing photos, status dots (green/amber/slate), and level badges.
- Build the Add/Edit Stylist Modal.
- **Important:** Implement the drag-and-drop photo upload area using `FormData` to send multipart data to the backend.

**19. Build `SettingsPage.jsx` (Route: `/admin/settings`)**
- Build the working hours table with Open/Close toggle switches and time inputs.

---

## ✂️ PHASE 6: Barber Panel

**20. Build `BarberPanel.jsx` (Route: `/berber`)**
- Create a simplified Sidebar just for the barber.
- Build the "Today's Schedule" view.
- Create sections for Pending Appointments (with green "Confirm" and red "Reject" buttons) and Confirmed Appointments (with a "Complete" button).

---

## ⚙️ PHASE 7: Backend API Logic Integration

**21. Build Services Endpoints**
- `GET /api/services`: Fetch all services.
- `POST /api/services`: Admin only. Create new service.
- `PATCH /api/services/:id`: Admin only. Update service.
- `DELETE /api/services/:id`: Admin only. Delete service.

**22. Update Barber Endpoints**
- `PATCH /api/barbers/:id`: Admin only. Handle updating barber details AND processing the Multer photo upload.
- `DELETE /api/barbers/:id`: Admin only. Delete barber.

**23. Update Appointment Endpoints**
- `DELETE /api/appointments/:id`: Admin only. Delete an appointment.
- `GET /api/appointments`: Add server-side filtering! If the user requesting is a `BARBER`, return *only* their appointments (`where: { barberId: currentUser.barberId }`).
- `GET /api/appointments/availability`: Return available time slots based on `barberId` and `date`.

**24. Build Dashboard Endpoint**
- `GET /api/auth/dashboard`: Calculate and return monthly revenue, weekly appointments, etc.