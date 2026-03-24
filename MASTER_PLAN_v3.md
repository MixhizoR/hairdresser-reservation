# 🗂️ HairMan Studio — MASTER PLAN v3
> Complete implementation guide. The AI reading this is not smart. Read every word. Do exactly what is written. Do not improvise.

---

## 📌 FINAL DECISIONS (Non-negotiable)

| Topic | Decision |
|-------|----------|
| UI Library | ❌ None. Tailwind CSS only. No Shadcn, MUI, Ant Design. |
| CSS Framework | ✅ Tailwind CDN in index.html |
| Font | ✅ Manrope — mandatory, no exceptions |
| Icons | ✅ Material Symbols Outlined only |
| Animation | ✅ Framer Motion — page transitions only, not for every element |
| Real-time | ✅ Polling (15s interval) — Socket.io will be REMOVED completely |
| Admin role | ✅ Normal BARBER account + admin password — no OWNER role |
| Booking | ✅ Separate `/book` route — not on landing page |
| Barber deletion | ✅ Soft delete (isActive: false) + block if future appointments exist |
| Appointment deletion | ✅ Soft delete (status: 'cancelled') — never hard delete |

---

## 🎨 DESIGN SYSTEM (Copy this into every AI prompt)

### Paste this block at the top of EVERY prompt you give to the AI:

```
DESIGN SYSTEM RULES — FOLLOW EXACTLY:
- Font: Manrope everywhere. No Inter, no Roboto, no Arial, no system fonts.
- Icons: Material Symbols Outlined only. Usage: <span className="material-symbols-outlined">icon_name</span>
- Colors: Use only the Tailwind tokens defined in index.html config.
  Primary text: text-on-surface (#2c3437)
  Primary blue: text-primary / bg-primary (#0060ad)
  Backgrounds: bg-surface (#f7f9fb), bg-surface-container-low (#f0f4f7), bg-surface-container (#eaeff2), bg-surface-container-lowest (#ffffff)

STRICT RULES — NEVER VIOLATE:
1. NEVER use 1px solid borders to separate sections. Use surface color shifts instead.
2. NEVER use pure black (#000000) for text. Always use text-on-surface.
3. NEVER use rounded or rounded-lg on large components. Use rounded-[2rem] or rounded-full.
4. NEVER use divider lines inside lists. Trust surface color shifts.
5. NEVER use generic box shadows like "shadow-md". Use ambient: shadow-[0_20px_40px_rgba(0,96,173,0.06)]
6. NEVER use Inter, Roboto, Arial, or system fonts.
7. Buttons must always be rounded-full (pill shape).
8. Modal overlays must always be: fixed inset-0 bg-black/40 backdrop-blur-xl z-50
9. Primary CTA buttons: bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-dim
10. Section spacing: py-20 or py-32 for top-level sections.
```

### Tailwind Config — Goes in index.html ONCE, applies everywhere:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        "primary": "#0060ad",
        "primary-dim": "#005498",
        "primary-fixed-dim": "#599ef1",
        "primary-container": "#68abff",
        "on-primary": "#f8f8ff",
        "on-primary-container": "#002b52",
        "surface": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f4f7",
        "surface-container": "#eaeff2",
        "surface-container-high": "#e3e9ed",
        "surface-container-highest": "#dce4e8",
        "surface-tint": "#0060ad",
        "on-surface": "#2c3437",
        "on-surface-variant": "#596064",
        "secondary-container": "#cde6f4",
        "on-secondary-container": "#3e5560",
        "tertiary": "#5f5a84",
        "tertiary-container": "#d3ccfd",
        "on-tertiary-container": "#47426b",
        "error": "#a83836",
        "error-container": "#fa746f",
        "on-error-container": "#6e0a12",
        "outline": "#747c80",
        "outline-variant": "#acb3b7",
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Manrope", "sans-serif"],
      },
    },
  },
}
```

### index.html head — Required tags:

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

### index.css — Global styles:

```css
body { font-family: 'Manrope', sans-serif; }
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.glass-card { backdrop-filter: blur(12px); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.ambient-shadow { box-shadow: 0 20px 40px rgba(0, 96, 173, 0.06); }
```

---

## 🗂️ FINAL FILE STRUCTURE

```
client/
├── index.html                      ← Tailwind CDN + fonts + config HERE
├── src/
│   ├── main.jsx
│   ├── App.jsx                     ← routing + auth state ONLY
│   ├── index.css                   ← global styles above
│   │
│   ├── hooks/
│   │   ├── useAppointments.js      ← NEW: polling hook
│   │   ├── useBarbers.js           ← NEW
│   │   └── useServices.js          ← NEW
│   │
│   ├── layouts/
│   │   └── AdminLayout.jsx         ← sidebar + topbar + <Outlet/>
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx         ← /
│   │   ├── BookingPage.jsx         ← /book
│   │   ├── TrackPage.jsx           ← /track
│   │   ├── LoginPage.jsx           ← /login
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AppointmentsPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   ├── StylistsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   │
│   │   └── barber/
│   │       └── BarberPanel.jsx
│   │
│   └── components/
│       ├── Navbar.jsx
│       ├── MiniCalendar.jsx
│       └── modals/
│           ├── BookingConfirmModal.jsx
│           ├── ServiceModal.jsx
│           ├── StylistModal.jsx
│           └── AppointmentModal.jsx

server/
├── src/
│   ├── app.js                      ← CORS fix here
│   ├── server.js                   ← remove Socket.io
│   ├── socket.js                   ← DELETE this file entirely
│   ├── config/
│   │   ├── env.js                  ← add startup validation
│   │   └── logger.js
│   ├── controllers/
│   │   ├── admin.controller.js     ← add getDashboard here
│   │   ├── appointment.controller.js ← remove socket calls
│   │   ├── barber.controller.js    ← NEW: move logic from barber.routes
│   │   ├── service.controller.js   ← NEW: full CRUD
│   │   └── system.controller.js    ← cache sounds list
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── rateLimit.middleware.js ← fix appointmentLimiter placement
│   │   └── requestLogger.middleware.js ← NEW
│   ├── routes/
│   │   ├── index.js
│   │   ├── admin.routes.js         ← move dashboard to controller
│   │   ├── appointment.routes.js   ← fix rate limiter placement
│   │   ├── barber.routes.js        ← delegate to barber.controller
│   │   ├── service.routes.js       ← NEW
│   │   └── system.routes.js
│   ├── services/
│   │   └── db.service.js           ← add Service methods, fix duplicates
│   └── utils/
│       └── validators.js
├── prisma/
│   ├── schema.prisma               ← add Service + BarberSchedule models
│   └── seed.js                     ← fix hardcoded password
└── uploads/
    └── barbers/                    ← NEW: photo upload destination
```

---

## 🔴 BACKEND FIXES (Do these first, in order)

### FIX 1 — CORS: Add DELETE and OPTIONS

**File: `server/src/app.js`**

Find this:
```javascript
methods: ['GET', 'POST', 'PATCH'],
```

Replace with:
```javascript
methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
```

Also add this line AFTER `app.use(cors(...))`:
```javascript
app.options('*', cors(corsOptions)); // Handle preflight requests
```

This is why the delete barber button was throwing a CORS error. Without OPTIONS and DELETE in the methods list, the browser's preflight request gets rejected.

---

### FIX 2 — Remove Socket.io Completely

**Why:** This project doesn't need real-time. Polling every 15 seconds is sufficient for a barbershop. Socket.io adds complexity, auth overhead, and reconnection logic for no real benefit here.

**Step 1:** Delete `server/src/socket.js` entirely.

**Step 2:** In `server/src/server.js`, remove all socket references:
```javascript
// DELETE these lines:
const socketModule = require('./socket');
socketModule.init(server);

// CHANGE this (no longer need http server for socket):
// Before:
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => { ... });

// After:
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3:** In `server/src/controllers/appointment.controller.js`, remove all socket calls:
```javascript
// DELETE this import at the top:
const socketModule = require('../socket');

// In createAppointment — DELETE these two lines:
const io = socketModule.getIO();
io.emit('new_appointment', appt);

// In updateAppointment — DELETE these two lines:
const io = socketModule.getIO();
io.emit('appointment_updated', updated);

// In deleteAppointment — DELETE these two lines:
const io = socketModule.getIO();
io.emit('appointment_deleted', { id });
```

**Step 4:** Uninstall socket.io from package.json:
```bash
npm uninstall socket.io
```

---

### FIX 3 — Rate Limiter on Wrong Endpoint

**File: `server/src/routes/appointment.routes.js`**

The `appointmentLimiter` is currently on GET /track. It must be on POST / (create appointment). This is the endpoint that prevents spam bookings.

```javascript
// WRONG — current code:
router.get('/track', appointmentLimiter, ...);
router.post('/', function(req, res, next) { ... }); // no limiter!

// CORRECT — fix to this:
router.get('/track', trackLimiter, ...);  // use separate trackLimiter
router.post('/', appointmentLimiter, function(req, res, next) { ... });
```

Also add a `trackLimiter` in `rateLimit.middleware.js`:
```javascript
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  message: { error: 'Çok fazla sorgulama. 15 dakika bekleyin.' },
  standardHeaders: true, legacyHeaders: false,
});
```

---

### FIX 4 — Remove Hardcoded allowedServices in Controller

**File: `server/src/controllers/appointment.controller.js`**

**Problem:** Services are hardcoded as a string array. When the admin adds a new service through the Services CRUD panel, customers cannot book it because this array rejects it as "invalid."

Remove this entire block:
```javascript
// DELETE THIS:
const allowedServices = [
  'Saç Kesimi', 'Sakal Kesimi', ...
];
if (!allowedServices.includes(service))
  return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });
```

Replace with a database lookup:
```javascript
// ADD THIS instead:
const serviceRecord = await db.findServiceByName(service);
if (!serviceRecord || !serviceRecord.isActive)
  return res.status(400).json({ error: 'Geçersiz veya pasif hizmet seçimi.' });
```

Also store the service duration so slot blocking works:
```javascript
// After finding the service record, use its duration:
const serviceDurationMinutes = serviceRecord.duration; // e.g. 90
```

---

### FIX 5 — Service Duration Slot Blocking

**File: `server/src/controllers/appointment.controller.js`** — in `createAppointment`

**Problem:** A 90-minute service at 10:00 only blocks 10:00. 10:30 and 11:00 remain bookable for the same barber, causing double-booking.

**Current code:**
```javascript
if (await db.findAppointmentByTimeForBarber(date, barberId))
  return res.status(400).json({ error: '...' });
```

**Replace with:**
```javascript
// Calculate how many 30-minute slots this service occupies
const slotsNeeded = Math.ceil(serviceRecord.duration / 30);

// Check ALL slots that would be occupied by this booking
for (let i = 0; i < slotsNeeded; i++) {
  const slotTime = new Date(date.getTime() + i * 30 * 60 * 1000);
  const conflict = await db.findAppointmentByTimeForBarber(slotTime, barberId);
  if (conflict) {
    return res.status(400).json({
      error: `Bu berber ${slotTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} saatinde dolu.`
    });
  }
}

// Also check if any EXISTING appointment's duration would overlap with this slot
const overlappingAppointment = await db.findOverlappingAppointment(date, barberId, serviceRecord.duration);
if (overlappingAppointment) {
  return res.status(400).json({ error: 'Bu saat mevcut bir randevu ile çakışıyor.' });
}
```

Add `findOverlappingAppointment` to `db.service.js`:
```javascript
const findOverlappingAppointment = async (newStartTime, barberId, newDurationMinutes) => {
  const newEndTime = new Date(newStartTime.getTime() + newDurationMinutes * 60 * 1000);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      barberId,
      status: { not: 'rejected' },
      // Find appointments that START before our new appointment ENDS
      time: { lt: newEndTime }
    },
    include: { service: true }
  });
  
  // Check if any existing appointment ENDS after our new appointment STARTS
  return appointments.find(appt => {
    const apptDuration = appt.service?.duration || 30;
    const apptEndTime = new Date(appt.time.getTime() + apptDuration * 60 * 1000);
    return apptEndTime > newStartTime;
  });
};
```

---

### FIX 6 — Remove Duplicate db Function

**File: `server/src/services/db.service.js`**

`findAppointmentByTime` and `findAppointmentByTimeForBarber` are identical. Delete `findAppointmentByTime` entirely. Remove it from exports too.

---

### FIX 7 — Fix Tracking Code to Use crypto

**File: `server/src/services/db.service.js`**

**Problem:** `Math.random()` is predictable. Someone could brute-force tracking codes to view other people's appointments.

```javascript
// WRONG — current code:
const generateTrackingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// CORRECT — replace with:
const generateTrackingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
};
// crypto is already imported at the top of this file — no new import needed
```

---

### FIX 8 — Soft Delete for Appointments

**File: `server/src/controllers/appointment.controller.js`** — `deleteAppointment` function

**Problem:** Hard deleting appointments loses historical data. An admin fat-fingers a delete and the record is gone forever.

```javascript
// WRONG — current code:
await db.deleteAppointment(id);

// CORRECT — replace the entire deleteAppointment function with:
const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await db.getAppointmentById(id);
    if (!appointment)
      return res.status(404).json({ error: 'Randevu bulunamadı.' });

    // Soft delete: set status to 'cancelled' instead of removing from DB
    const updated = await db.updateAppointment(id, { status: 'cancelled' });
    res.json({ success: true, message: 'Randevu iptal edildi.', appointment: updated });
  } catch (err) {
    log('error', 'DELETE /api/appointments/:id failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
```

---

### FIX 9 — Block Barber Deletion if Future Appointments Exist

**File: `server/src/routes/barber.routes.js`** → move to `server/src/controllers/barber.controller.js`

In the delete handler:
```javascript
const deleteBarber = async (req, res) => {
  const { id } = req.params;
  try {
    const barber = await db.findUserById(id);
    if (!barber || barber.role !== 'BARBER')
      return res.status(404).json({ error: 'Berber bulunamadı.' });
    if (barber.id === req.user.id)
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });

    // Check for future pending or approved appointments
    const futureAppointments = await db.getFutureAppointmentsForBarber(id);
    if (futureAppointments.length > 0) {
      return res.status(400).json({
        error: `Bu berberin ${futureAppointments.length} adet gelecek randevusu var. Silmeden önce bu randevuları başka bir berbere atayın veya iptal edin.`,
        appointments: futureAppointments.map(a => ({
          id: a.id,
          time: a.time,
          customerName: a.name,
          service: a.service
        }))
      });
    }

    // Safe to soft delete
    await db.updateUser(id, { isActive: false });
    res.json({ success: true, message: 'Berber pasif hale getirildi.' });
  } catch (err) {
    log('error', 'DELETE /api/barbers/:id failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
```

Add to `db.service.js`:
```javascript
const getFutureAppointmentsForBarber = async (barberId) => {
  return await prisma.appointment.findMany({
    where: {
      barberId,
      status: { in: ['pending', 'approved'] },
      time: { gt: new Date() }
    }
  });
};
```

---

### FIX 10 — Move Dashboard Logic to Controller

**File: `server/src/routes/admin.routes.js`**

The `/dashboard` handler has all its logic inline in the route file. This is wrong. Move it.

In `admin.routes.js`, replace the inline handler:
```javascript
// WRONG — current:
router.get('/dashboard', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const db = require('../services/db.service'); // importing inside a function — also wrong
  try { ... }
});

// CORRECT:
router.get('/dashboard', authMiddleware, requireRole('ADMIN'), getDashboard);
```

Add `getDashboard` to `admin.controller.js`:
```javascript
const getDashboard = async (req, res) => {
  try {
    // Run all count queries in parallel instead of sequentially
    const [stats, appointments, barbers] = await Promise.all([
      db.getDashboardStats(),
      db.getAppointments(),
      db.getAllBarbers()
    ]);
    const recentAppointments = appointments.slice(0, 10);
    res.json({ stats, recentAppointments, barbers });
  } catch (err) {
    log('error', 'GET /api/auth/dashboard failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
```

Also fix `getDashboardStats` in `db.service.js` to use `Promise.all` instead of sequential awaits:
```javascript
const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, pending, approved, completed, activeBarbers, todayCount] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'pending' } }),
    prisma.appointment.count({ where: { status: 'approved' } }),
    prisma.appointment.count({ where: { status: 'completed' } }),
    prisma.user.count({ where: { role: 'BARBER', isActive: true } }),
    prisma.appointment.count({ where: { time: { gte: today, lt: tomorrow } } })
  ]);

  return {
    totalAppointments: total,
    pendingAppointments: pending,
    approvedAppointments: approved,
    completedAppointments: completed,
    activeBarbers,
    todayAppointments: todayCount
  };
};
```

---

### FIX 11 — Move barber.routes.js Logic to barber.controller.js

**Create: `server/src/controllers/barber.controller.js`**

Move ALL the async handler functions from `barber.routes.js` into this new controller file. Follow the exact same pattern as `admin.controller.js` and `appointment.controller.js`:

```javascript
// barber.controller.js structure:
const getAllBarbers = async (req, res) => { ... };
const getAllBarbersAdmin = async (req, res) => { ... };
const getBarber = async (req, res) => { ... };
const createBarber = async (req, res) => { ... };
const updateBarber = async (req, res) => { ... };
const deleteBarber = async (req, res) => { ... };
const toggleBarberStatus = async (req, res) => { ... };

module.exports = { getAllBarbers, getAllBarbersAdmin, getBarber, createBarber, updateBarber, deleteBarber, toggleBarberStatus };
```

Then `barber.routes.js` becomes thin — only route definitions:
```javascript
const { getAllBarbers, ... } = require('../controllers/barber.controller');
router.get('/', getAllBarbers);
router.get('/all', authMiddleware, requireRole('ADMIN'), getAllBarbersAdmin);
// etc.
```

**IMPORTANT:** Fix the CRLF line endings. The current `barber.routes.js` uses Windows `\r\n` line endings while all other files use Unix `\n`. When you rewrite this file as `barber.controller.js`, make sure the editor/AI saves it with LF line endings, not CRLF.

---

### FIX 12 — Add Centralized Error Handler

**File: `server/src/app.js`** — add at the VERY BOTTOM, after all other middleware and routes:

```javascript
// Centralized error handler — must be LAST, after app.use('/api', apiRoutes)
app.use((err, req, res, next) => {
  log('error', err.message, { stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ 
    error: err.message || 'Sunucu hatası.' 
  });
});
```

Now controllers can call `next(err)` instead of writing `res.status(500)` everywhere. Existing try/catch blocks can be simplified over time.

---

### FIX 13 — Add Request Logger Middleware

**Create: `server/src/middlewares/requestLogger.middleware.js`**

```javascript
const { log } = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', 'HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip
    });
  });
  next();
};

module.exports = { requestLogger };
```

**File: `server/src/app.js`** — add after helmet:
```javascript
const { requestLogger } = require('./middlewares/requestLogger.middleware');
app.use(requestLogger);
```

---

### FIX 14 — Add Environment Validation on Startup

**File: `server/src/config/env.js`** — add at the top:

```javascript
require('dotenv').config();

// Fail fast if required env variables are missing in production
if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGIN'];
  required.forEach(key => {
    if (!process.env[key]) {
      throw new Error(`FATAL: Missing required environment variable: ${key}`);
    }
  });
}

// Warn in development if using defaults
if (process.env.JWT_SECRET === 'change-me-to-a-long-random-secret-string-in-production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Change this before going to production!');
}
```

---

### FIX 15 — Fix seed.js Hardcoded Password

**File: `server/prisma/seed.js`**

```javascript
// WRONG — current code:
const ADMIN_PASSWORD = 'noir2026';

// CORRECT:
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'dev-only-change-in-production';

// Also: do NOT print the password to console in production
if (process.env.NODE_ENV !== 'production') {
  console.log(`   Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
} else {
  console.log('   Admin credentials set from environment variables.');
}
```

---

### FIX 16 — Cache the Sounds List

**File: `server/src/controllers/system.controller.js`**

```javascript
// WRONG — current: reads filesystem on EVERY request
const getSounds = (req, res) => {
  const files = fs.readdirSync(soundsDir)...
  res.json({ files });
};

// CORRECT — cache on first call:
let cachedSounds = null;

const getSounds = (req, res) => {
  if (cachedSounds) return res.json({ files: cachedSounds });
  
  try {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
    cachedSounds = fs.readdirSync(soundsDir)
      .filter(f => audioExtensions.includes(path.extname(f).toLowerCase()) && !f.startsWith('.'));
    res.json({ files: cachedSounds });
  } catch {
    res.json({ files: [] });
  }
};
```

---

### FIX 17 — Remove console.log DEBUG statements from barber.routes.js

When rewriting barber.routes.js (as part of FIX 11), remove ALL of these:
```javascript
// DELETE all of these:
console.log('[DEBUG] GET /api/barbers called');
console.log('[DEBUG] Barbers from DB:', barbers, ...);
console.log('[DEBUG] Sending safeBarbers:', safeBarbers);
console.error('[DEBUG] Error in GET /api/barbers:', err);
```

Replace with the structured logger:
```javascript
const { log } = require('../config/logger');
log('info', 'GET /api/barbers called');
log('error', 'GET /api/barbers failed', { err: err.message });
```

---

## 🔵 PRISMA SCHEMA CHANGES

**File: `server/prisma/schema.prisma`**

### Add to User model:
```prisma
model User {
  // ... existing fields ...
  photoUrl   String?  // NEW: barber profile photo path e.g. "/uploads/barbers/barber-123.jpg"
  level      String   @default("JUNIOR") // NEW: JUNIOR | SENIOR | MASTER | DIRECTOR
  speciality String?  // NEW: e.g. "Fade Expert", "Color Specialist"
  
  // existing relations:
  appointments Appointment[]
  schedule     BarberSchedule[] // NEW relation
}
```

### Add Service model (NEW):
```prisma
model Service {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  price       Float
  duration    Int      // REQUIRED: duration in minutes (e.g. 30, 45, 90)
  category    String   @default("BARBERING") // BARBERING | GROOMING | TREATMENTS
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  appointments Appointment[] // NEW relation
}
```

### Add BarberSchedule model (NEW):
```prisma
model BarberSchedule {
  id        String  @id @default(uuid())
  barberId  String
  barber    User    @relation(fields: [barberId], references: [id], onDelete: Cascade)
  dayOfWeek Int     // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime String  // "09:00"
  endTime   String  // "18:00"
  isOff     Boolean @default(false) // true = barber doesn't work this day
}
```

### Update Appointment model:
```prisma
model Appointment {
  // ... existing fields ...
  serviceId   String?  // NEW: relation to Service model
  serviceObj  Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  barberName  String?  // NEW: copy of barber name at booking time (for historical records after barber deletion)
  
  // CHANGE: make barberId nullable for soft-deleted barbers
  barberId    String?  // was String, now String?
  barber      User?    @relation(fields: [barberId], references: [id], onDelete: SetNull)
  // CHANGE: onDelete was Cascade (deletes appointment), now SetNull (keeps appointment, clears barberId)
}
```

### IMPORTANT: After any schema change, run:
```bash
npx prisma migrate dev --name "describe_what_changed"
npx prisma generate
```

---

## 🔵 NEW BACKEND: Services CRUD

### Create: `server/src/controllers/service.controller.js`

```javascript
const db = require('../services/db.service');
const { log } = require('../config/logger');

const getAllServices = async (req, res) => {
  try {
    const services = await db.getAllServices();
    res.json(services);
  } catch (err) {
    log('error', 'GET /api/services failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

const createService = async (req, res) => {
  const { name, description, price, duration, category } = req.body;
  if (!name || !price || !duration)
    return res.status(400).json({ error: 'İsim, fiyat ve süre zorunludur.' });
  if (typeof duration !== 'number' || duration < 15 || duration > 480)
    return res.status(400).json({ error: 'Süre 15-480 dakika arasında olmalıdır.' });
  if (duration % 15 !== 0)
    return res.status(400).json({ error: 'Süre 15 dakikanın katı olmalıdır (15, 30, 45, 60...).' });
  
  try {
    const service = await db.createService({ name, description, price: parseFloat(price), duration: parseInt(duration), category: category || 'BARBERING' });
    res.status(201).json(service);
  } catch (err) {
    log('error', 'POST /api/services failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration, category, isActive } = req.body;
  if (duration !== undefined) {
    if (typeof duration !== 'number' || duration < 15 || duration > 480)
      return res.status(400).json({ error: 'Süre 15-480 dakika arasında olmalıdır.' });
    if (duration % 15 !== 0)
      return res.status(400).json({ error: 'Süre 15 dakikanın katı olmalıdır.' });
  }
  try {
    const service = await db.updateService(id, { name, description, price: price ? parseFloat(price) : undefined, duration: duration ? parseInt(duration) : undefined, category, isActive });
    res.json(service);
  } catch (err) {
    log('error', 'PATCH /api/services/:id failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete — set isActive to false
    await db.updateService(id, { isActive: false });
    res.json({ success: true, message: 'Hizmet pasif hale getirildi.' });
  } catch (err) {
    log('error', 'DELETE /api/services/:id failed', { err: err.message });
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

module.exports = { getAllServices, createService, updateService, deleteService };
```

### Create: `server/src/routes/service.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { getAllServices, createService, updateService, deleteService } = require('../controllers/service.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.get('/', getAllServices);                                              // public
router.post('/', authMiddleware, requireRole('ADMIN'), createService);       // admin only
router.patch('/:id', authMiddleware, requireRole('ADMIN'), updateService);   // admin only
router.delete('/:id', authMiddleware, requireRole('ADMIN'), deleteService);  // admin only

module.exports = router;
```

### Add to `server/src/routes/index.js`:
```javascript
const serviceRoutes = require('./service.routes');
router.use('/services', serviceRoutes); // /api/services/*
```

### Add to `server/src/services/db.service.js`:
```javascript
// SERVICE METHODS
const getAllServices = async () => {
  return await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
};

const getAllServicesAdmin = async () => {
  return await prisma.service.findMany({ orderBy: { name: 'asc' } }); // includes inactive
};

const findServiceByName = async (name) => {
  return await prisma.service.findFirst({ where: { name, isActive: true } });
};

const findServiceById = async (id) => {
  return await prisma.service.findUnique({ where: { id } });
};

const createService = async (data) => {
  return await prisma.service.create({ data });
};

const updateService = async (id, data) => {
  // Remove undefined values so Prisma doesn't overwrite with null
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  return await prisma.service.update({ where: { id }, data: cleanData });
};

// Export these too
module.exports = {
  // ... existing exports ...
  getAllServices,
  getAllServicesAdmin,
  findServiceByName,
  findServiceById,
  createService,
  updateService,
  getFutureAppointmentsForBarber,
  findOverlappingAppointment,
};
```

---

## 🔵 PHOTO UPLOAD FOR BARBERS

### Install multer:
```bash
cd server && npm install multer
```

### Create upload directory:
```bash
mkdir -p server/uploads/barbers
```

### Add to `server/src/app.js`:
```javascript
const path = require('path');
// Serve uploaded files statically
// A request to /uploads/barbers/barber-123.jpg will serve the file from disk
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
```

### Add multer setup to `server/src/controllers/barber.controller.js`:
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads', 'barbers')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `barber-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const photoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sadece görsel dosyaları yüklenebilir.'));
  }
});

// Export for use in routes:
module.exports.photoUpload = photoUpload;
```

### Update barber create/update routes to use multer:
```javascript
// barber.routes.js
const { photoUpload } = require('../controllers/barber.controller');

router.post('/', authMiddleware, requireRole('ADMIN'), photoUpload.single('photo'), createBarber);
router.put('/:id', authMiddleware, photoUpload.single('photo'), updateBarber);
```

### In createBarber and updateBarber controller functions:
```javascript
// If a photo was uploaded, req.file will be set by multer
const photoUrl = req.file ? `/uploads/barbers/${req.file.filename}` : undefined;

// Include in the data being saved:
const updateData = { name, phone, level, speciality };
if (photoUrl) updateData.photoUrl = photoUrl;
if (password) updateData.password = await bcrypt.hash(password, 12);
```

### Frontend — when uploading photo, use FormData NOT JSON:
```javascript
// IMPORTANT: When sending a form with a file, do NOT use JSON
// Use FormData instead:
const formData = new FormData();
formData.append('photo', selectedFile);     // the File object from input
formData.append('name', barberForm.name);
formData.append('level', barberForm.level);
// etc.

fetch('/api/barbers', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  // DO NOT set Content-Type header — browser sets it automatically with boundary
  body: formData
});
```

### When no photo is uploaded, use a default avatar:
```javascript
// In the frontend, when displaying a barber photo:
<img src={barber.photoUrl || '/default-avatar.png'} alt={barber.name} />
// Add a default-avatar.png to client/public/
```

---

## 🔵 FRONTEND: REPLACE SOCKET.IO WITH POLLING

### Create: `client/src/hooks/usePolling.js`

```javascript
import { useEffect, useRef } from 'react';

// Generic polling hook
// interval: milliseconds between polls (default 15000 = 15 seconds)
// fn: async function to call on each poll
// enabled: set to false to pause polling (e.g. when user is not on admin/barber page)
export function usePolling(fn, interval = 15000, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;
    
    // Call immediately on mount
    fnRef.current();
    
    // Then call every interval
    const id = setInterval(() => fnRef.current(), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
}
```

### Create: `client/src/hooks/useAppointments.js`

```javascript
import { useState, useCallback } from 'react';
import { usePolling } from './usePolling';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

export function useAppointments(token, enabled = true) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      
      // Check if new pending appointments appeared — play sound if so
      const newPendingCount = list.filter(a => a.status === 'pending').length;
      if (newPendingCount > pendingCount && pendingCount !== 0) {
        // Dispatch custom event so the panel can play a sound
        window.dispatchEvent(new CustomEvent('new-pending-appointment'));
      }
      setPendingCount(newPendingCount);
      setAppointments(list);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setLoading(false);
    }
  }, [token]);

  // Poll every 15 seconds, only when enabled (user is on admin/barber page)
  usePolling(fetchAppointments, 15000, enabled);

  return { appointments, loading, refresh: fetchAppointments };
}
```

### Create: `client/src/hooks/useServices.js`

```javascript
import { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/services`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { services, loading };
}
```

### Create: `client/src/hooks/useBarbers.js`

```javascript
import { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

export function useBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/barbers`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBarbers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { barbers, loading };
}
```

### Update `client/src/App.jsx` — Remove ALL socket code:

```javascript
// DELETE all of these imports and usages:
import { io } from 'socket.io-client';
// const socketRef = useRef(null);
// All useEffect blocks that reference socketRef
// All socket.on() calls
// All socket.off() calls

// App.jsx should now ONLY contain:
// 1. Auth state (token, userRole, currentUser)
// 2. handleLogin, handleLogout functions
// 3. Route definitions
// 4. ProtectedRoute component
// Nothing else. No appointments state. No barbers state. No socket.
```

### How to use polling in admin/barber pages:

```javascript
// AppointmentsPage.jsx or BarberPanel.jsx
import { useAppointments } from '../../hooks/useAppointments';

export default function AppointmentsPage({ token }) {
  // enabled=true means polling is active on this page
  const { appointments, loading, refresh } = useAppointments(token, true);
  
  // Listen for new pending appointment sound event
  useEffect(() => {
    const playSound = () => { /* play notification sound */ };
    window.addEventListener('new-pending-appointment', playSound);
    return () => window.removeEventListener('new-pending-appointment', playSound);
  }, []);

  // ... rest of component
}
```

---

## 🔵 FRONTEND: SLOT BLOCKING BASED ON SERVICE DURATION

### In `client/src/pages/BookingPage.jsx`:

When a service is selected and a time slot is clicked, grey out subsequent slots based on duration.

```javascript
// Helper: given a selected slot and service duration, return all blocked slots
const getBlockedSlots = (selectedSlot, durationMinutes) => {
  if (!selectedSlot || !durationMinutes) return [];
  const slotsNeeded = Math.ceil(durationMinutes / 30);
  const blocked = [];
  const [hour, min] = selectedSlot.split(':').map(Number);
  for (let i = 1; i < slotsNeeded; i++) {
    const totalMinutes = hour * 60 + min + i * 30;
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    blocked.push(`${h}:${m}`);
  }
  return blocked;
};

// In the slot rendering:
const blockedSlots = getBlockedSlots(selectedSlot, selectedService?.duration);

// A slot is unavailable if:
// 1. It's already taken by another appointment (from API)
// 2. It's in the blockedSlots array (occupied by current selection's duration)
const isSlotUnavailable = (slot) => {
  return isSlotTaken(slot) || blockedSlots.includes(slot);
};

// When rendering slot buttons:
<button
  disabled={isSlotUnavailable(slot)}
  className={`... ${isSlotUnavailable(slot) ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
  onClick={() => !isSlotUnavailable(slot) && setSelectedSlot(slot)}
>
  {slot}
</button>
```

### Also: show service duration on the booking page:

```javascript
// In the service card, show duration prominently:
<div className="flex items-center gap-1 text-xs text-on-surface-variant">
  <span className="material-symbols-outlined text-sm">schedule</span>
  {service.duration} dk
</div>
```

---

## 🔵 FRONTEND: JWT IN httpOnly COOKIE

### Backend change — `server/src/controllers/admin.controller.js`:

```javascript
// In the login function, instead of just returning the token in JSON:
res.cookie('auth_token', token, {
  httpOnly: true,      // JS cannot read this cookie — prevents XSS theft
  sameSite: 'strict',  // prevents CSRF
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
});

// Still return it in JSON body for backwards compatibility during transition:
res.json({ success: true, token, user: { ... } });
```

### Frontend change — add `credentials: 'include'` to all fetch calls:

```javascript
// Every fetch call in the frontend must include:
fetch('/api/appointments', {
  credentials: 'include', // sends cookies automatically
  headers: { Authorization: `Bearer ${token}` } // keep for now during transition
});
```

### Note: This is a gradual migration. Both cookie and Authorization header work during transition.

---

## 🔵 FRONTEND: App.jsx Clean Architecture

**File: `client/src/App.jsx`**

App.jsx must ONLY contain these things. Nothing else.

```javascript
// App.jsx responsibilities:
// 1. Auth state management
// 2. handleLogin / handleLogout
// 3. Route definitions with ProtectedRoute
// 4. No appointments state
// 5. No barbers state  
// 6. No socket code
// 7. No fetch calls except /api/auth/me for session restore

// ProtectedRoute component stays here:
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (isRestoringSession) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/berber'} replace />;
  }
  return children;
};

// Routes:
// / → LandingPage (no auth needed)
// /book → BookingPage (no auth needed)
// /track → TrackPage (no auth needed)
// /login → LoginPage (redirect to /admin or /berber if already logged in)
// /admin/* → AdminLayout with nested routes (ADMIN only)
// /berber → BarberPanel (BARBER only)
```

---

## 🔵 FRONTEND: ERROR HANDLING PATTERN

Use this exact same pattern in EVERY component that makes API calls. No exceptions.

```javascript
// At the top of every component that fetches data:
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

// In every submit/action handler:
const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(...);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Bir hata oluştu.');
    }
    // success path
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Display errors inline, NOT as alerts or popups:
{error && (
  <div className="bg-error-container text-on-error-container rounded-xl p-3 text-sm font-medium">
    {error}
  </div>
)}
```

---

## 🔵 FRONTEND: API CALLS — NEVER USE JSON WITH FILE UPLOADS

```javascript
// When sending text data only → use JSON:
fetch('/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ name, phone, service, time, barberId })
});

// When sending data WITH a file → use FormData, NO Content-Type header:
const formData = new FormData();
formData.append('photo', fileInputRef.current.files[0]);
formData.append('name', name);

fetch('/api/barbers', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }, // NO Content-Type — browser sets it
  body: formData
});
```

---

## 📋 IMPLEMENTATION ORDER

Do these in exact order. Do not skip ahead.

### Backend (do all of these before touching the frontend):
1. FIX 1 — CORS add DELETE + OPTIONS
2. FIX 2 — Remove Socket.io completely
3. FIX 3 — Move rate limiter to POST /appointments
4. FIX 6 — Remove duplicate db function
5. FIX 17 — Remove console.log debug statements
6. FIX 12 — Add centralized error handler
7. FIX 13 — Add request logger middleware
8. FIX 14 — Add env validation
9. Prisma schema changes (User fields + Service model + BarberSchedule model)
10. Run `npx prisma migrate dev --name "add_service_and_schedule_models"`
11. FIX 4 — Remove hardcoded allowedServices (depends on Service model existing)
12. FIX 5 — Service duration slot blocking in createAppointment
13. NEW — Services CRUD (controller + routes + db methods)
14. FIX 7 — Fix tracking code crypto
15. FIX 8 — Soft delete for appointments
16. FIX 9 — Block barber deletion if future appointments
17. FIX 10 — Move dashboard to controller, use Promise.all
18. FIX 11 — Create barber.controller.js, fix CRLF line endings
19. Photo upload — multer setup, barber create/update with photo
20. FIX 15 — Fix seed.js
21. FIX 16 — Cache sounds list

### Frontend (after backend is done):
1. index.html — Tailwind config + fonts
2. index.css — global styles
3. Remove socket.io: `npm uninstall socket.io-client`
4. Create hooks: usePolling.js, useAppointments.js, useServices.js, useBarbers.js
5. Clean up App.jsx — remove all socket code, remove all state except auth
6. AdminLayout.jsx — sidebar + topbar
7. LoginPage.jsx
8. LandingPage.jsx
9. BookingPage.jsx — with service duration slot blocking
10. TrackPage.jsx
11. admin/DashboardPage.jsx
12. admin/AppointmentsPage.jsx
13. admin/ServicesPage.jsx — with Service modal (duration field required)
14. admin/StylistsPage.jsx — with photo upload
15. admin/SettingsPage.jsx — barber schedules
16. barber/BarberPanel.jsx

---

## ⚠️ THINGS TO NEVER DO (for the AI reading this)

1. **Never hard-delete appointments.** Always set `status: 'cancelled'`.
2. **Never hard-delete barbers.** Always set `isActive: false`. Block if future appointments exist.
3. **Never use `Math.random()` for security-sensitive values.** Use `crypto.randomBytes()`.
4. **Never put business logic inside route files.** It goes in controllers.
5. **Never import `db.service.js` inside a route handler function.** Import at the top of the file.
6. **Never call `io.emit()` from a controller.** Socket.io is removed. Use polling.
7. **Never return the user's password from any endpoint**, even as a hash.
8. **Never use `border` for visual separation.** Use surface color shifts.
9. **Never use `Math.random()` for IDs or tokens.** Use `crypto.randomUUID()` or `uuid`.
10. **Never skip `credentials: 'include'` on fetch calls after cookie auth is added.**
11. **Never set `Content-Type: application/json` when sending FormData.** The browser does it.
12. **Never use `console.log` for logging.** Use the structured `log()` from `config/logger.js`.
13. **Never add new fields to the User model for admin-only data.** Admins and barbers share the model — barber-specific fields (`photoUrl`, `level`, `speciality`) are okay because they are barber-specific features.
14. **Never run database queries in a loop.** Use `Promise.all([...])` for parallel queries.
