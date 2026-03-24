# 🗂️ HairMan Studio — GÜNCEL MASTER PLAN v2
> Tailwind CSS + Manrope + Material Symbols + birebir tasarım referansları

---

## 📌 TEMEL KARARLAR (Tartışmasız)

| Konu | Karar | Sebep |
|------|-------|-------|
| UI Library | ❌ Yok | Tasarımlar zaten custom Tailwind ile yazılmış |
| CSS Framework | ✅ Tailwind CDN | Tüm HTML'ler bunu kullanıyor |
| Font | ✅ Manrope | DESIGN.md'de kesin zorunluluk |
| İkonlar | ✅ Material Symbols Outlined | Tüm HTML'lerde bu kullanılmış |
| Animasyon | ✅ Framer Motion (mevcut) | Sadece page transitions için |
| Admin Rol | ✅ Normal BARBER + admin şifresi | Ekstra complexity gereksiz |
| Rezervasyon | ✅ Ayrı `/book` route | UX ve gelecek genişleme için |

---

## 🎨 DESIGN SYSTEM (Kod Yazarken Bunları Kullan)

### Tailwind Config — Her Dosyada Aynı Olmalı

```javascript
// vite.config.js veya index.html'de CDN ile yüklenecek
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Ana renkler
        "primary": "#0060ad",
        "primary-dim": "#005498",
        "primary-fixed": "#68abff",
        "primary-fixed-dim": "#599ef1",
        "primary-container": "#68abff",
        "on-primary": "#f8f8ff",
        "on-primary-container": "#002b52",

        // Surface hiyerarşisi
        "surface": "#f7f9fb",
        "surface-bright": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f4f7",
        "surface-container": "#eaeff2",
        "surface-container-high": "#e3e9ed",
        "surface-container-highest": "#dce4e8",
        "surface-variant": "#dce4e8",
        "surface-tint": "#0060ad",

        // Metin renkleri
        "on-surface": "#2c3437",
        "on-surface-variant": "#596064",
        "on-background": "#2c3437",

        // Secondary
        "secondary": "#4b626e",
        "secondary-dim": "#3f5661",
        "secondary-container": "#cde6f4",
        "secondary-fixed-dim": "#bfd8e5",
        "on-secondary": "#f2faff",
        "on-secondary-container": "#3e5560",
        "on-secondary-fixed-variant": "#475f6a",

        // Tertiary (soft actions)
        "tertiary": "#5f5a84",
        "tertiary-dim": "#534e77",
        "tertiary-container": "#d3ccfd",
        "tertiary-fixed-dim": "#c5beee",
        "on-tertiary": "#fcf7ff",
        "on-tertiary-container": "#47426b",

        // Error
        "error": "#a83836",
        "error-dim": "#67040d",
        "error-container": "#fa746f",
        "on-error": "#fff7f6",
        "on-error-container": "#6e0a12",

        // Outline
        "outline": "#747c80",
        "outline-variant": "#acb3b7",
      },
      fontFamily: {
        "headline": ["Manrope"],
        "body": ["Manrope"],
        "label": ["Manrope"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px",
      },
    },
  },
}
```

### Google Fonts + Material Symbols — index.html head'e

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```

### CSS — index.css'e Ekle

```css
body { font-family: 'Manrope', sans-serif; }
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.glass-card { backdrop-filter: blur(12px); }
.no-scrollbar::-webkit-scrollbar { display: none; }

/* Ambient shadow — tasarım sisteminin özel gölgesi */
.ambient-shadow { box-shadow: 0 20px 40px rgba(0, 96, 173, 0.06); }
```

### DESIGN RULES (Yapay zekaya her prompt'ta hatırlat)

**✅ Yapılacaklar:**
- Border yerine tonal surface shift kullan (`surface-container-low` içinde `surface-container-lowest` kart)
- Büyük componentler için `rounded-[2rem]` veya `rounded-full` kullan
- Butonlar: `rounded-full` (pill shape)
- Section margins: `py-20` veya `py-32` — "expensive" boşluk hissi
- Primary CTA shadow: `shadow-lg shadow-primary/20`
- Gölge: `shadow-[0_20px_40px_rgba(0,96,173,0.06)]` (tinted ambient)
- Modal overlay: `backdrop-blur-xl bg-black/40`

**❌ Yapılmayacaklar:**
- `border-[1px solid #xxx]` ile section ayırma — KESİNLİKLE YASAK
- Pure black `#000000` metin — her zaman `text-on-surface` (`#2c3437`)
- `rounded` veya `rounded-lg` büyük componentlerde — eskimiş görünür
- Divider çizgi liste içinde — surface shift yeterli
- `Inter`, `Roboto`, `Arial` fontları
- Drop shadow yerine `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` tarzı generic shadow

---

## 📁 PROJE YAPISI (Son Hali)

```
client/
├── index.html                    ← Tailwind CDN + font linkleri BURAYA
├── src/
│   ├── main.jsx
│   ├── App.jsx                   ← sadece routing + auth state + socket
│   ├── index.css                 ← global + Tailwind directives
│   │
│   ├── layouts/
│   │   └── AdminLayout.jsx       ← sidebar + header + <Outlet/>
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx       ← / route
│   │   ├── BookingPage.jsx       ← /book route
│   │   ├── TrackPage.jsx         ← /track route
│   │   ├── LoginPage.jsx         ← /login route
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AppointmentsPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   └── StylistsPage.jsx
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
│
server/
├── index.js
├── prisma/schema.prisma
├── uploads/barbers/
└── .env
```

---

## 🔧 TEKNİK BEST PRACTICES

### ❶ Vite + Tailwind Entegrasyonu

**Problem:** `cdn.tailwindcss.com` development için iyi ama production'da yavaş.
**Çözüm:** Geliştirme yaparken CDN yeterli. İleride production'a geçince `npm install -D tailwindcss postcss autoprefixer` ile gerçek Tailwind kurul.

Şimdilik `index.html`'e CDN ekle, Tailwind config'i `<script>` bloğu içinde yaz (tasarım dosyalarındaki gibi).

### ❷ State Yönetimi — App.jsx'te Ne Tutulur?

```
App.jsx'te SADECE bunlar olmalı:
- token, userRole, currentUser (auth state)
- socket ref
- handleLogin, handleLogout fonksiyonları

App.jsx'te OLMAMALI:
- appointments state → ilgili page component'inde fetch edilmeli
- barbers state → BookingPage ve StylistsPage kendi fetch'ini yapmalı
- selectedDate, selectedSlot → BookingPage'in kendi state'i
```

**Şu anki sorun:** App.jsx şişirilmiş, her şey orada. Her page kendi data'sını kendi fetch etmeli.

### ❸ API Çağrıları — Custom Hook Pattern

Her sayfada `fetch(...)` tekrar tekrar yazmak yerine:

```javascript
// src/hooks/useAppointments.js
export function useAppointments(token) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const refresh = async () => {
    const res = await fetch('/api/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  };
  
  useEffect(() => { refresh(); }, [token]);
  return { appointments, loading, refresh };
}

// Kullanım — AppointmentsPage.jsx
const { appointments, loading, refresh } = useAppointments(token);
```

Bu pattern: `useAppointments`, `useBarbers`, `useServices` için uygula.

### ❹ Protected Route Pattern

```jsx
// App.jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userRole, isRestoring } = useAuth();
  
  if (isRestoring) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/berber'} replace />;
  }
  return children;
};
```

### ❺ Socket.io — Sadece İlgili Sayfalarda Dinle

```javascript
// Yanlış: Her socket event her zaman dinleniyor (mevcut durum)
socket.on('new_appointment', ...);

// Doğru: Sadece admin/berber panelindeyken dinle
useEffect(() => {
  if (!token) return;
  socket.on('new_appointment', handleNew);
  return () => socket.off('new_appointment', handleNew);
}, [token]);
```

### ❻ Form Validation — Her Input İçin

```javascript
// Türk telefon validasyonu
const isValidPhone = (val) => /^05\d{9}$/.test(val);

// İsim validasyonu
const isValidName = (val) => val.trim().length >= 2 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(val);

// Honeypot — her public form'da
<input type="text" name="website" style={{display: 'none'}} tabIndex={-1} autoComplete="off" />
```

### ❼ Error Handling Pattern

```jsx
// Her fetch'te:
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(...);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Bir hata oluştu');
    }
    // başarı
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### ❽ Modal Pattern — Tailwind ile

```jsx
// Tüm modallarda aynı wrapper kullan:
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Overlay */}
    <div 
      className="absolute inset-0 bg-black/40 backdrop-blur-xl"
      onClick={onClose}
    />
    {/* Modal content */}
    <div className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg ambient-shadow">
      {/* içerik */}
    </div>
  </div>
)}
```

### ❾ Backend CORS Fix — Hemen Yap

```javascript
// server/index.js — EN ÜSTE, diğer her şeyden önce
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGIN 
    : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight için
```

---

## 🔵 PHASE 1: index.html Güncellemesi

**Dosya:** `client/index.html`

```html
<!DOCTYPE html>
<html lang="tr" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HairMan Studio</title>
  
  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  
  <!-- Manrope Font -->
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  
  <!-- Material Symbols -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  
  <!-- Tailwind Config -->
  <script>
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
          borderRadius: {
            "xl": "0.75rem",
            "2xl": "1rem",
            "3xl": "1.5rem",
          },
        },
      },
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

## 🔵 PHASE 2: LandingPage.jsx — `/` Route

**Referans dosya:** `landing_page_ratings_removed/code.html`

**Bileşen Yapısı:**

```jsx
// src/pages/LandingPage.jsx
export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface font-body">
      <Navbar />         {/* sticky, glassmorphism */}
      <HeroSection />    {/* full-screen, arka plan foto */}
      <ServicesSection />{/* bg-surface-container, bento grid */}
      <StylistsSection />{/* berberler, grayscale → renkli hover */}
      <CTASection />     {/* koyu mavi, "Ready to find your sanctuary?" */}
      <Footer />
    </div>
  );
}
```

### Navbar Detayı

```
Yükseklik: h-20
Arka plan: bg-white/80 backdrop-blur-xl
Gölge: shadow-[0_20px_40px_rgba(0,96,173,0.06)]
Position: fixed top-0 w-full z-50

Sol: "HairMan Studio" — text-2xl font-bold tracking-tighter text-sky-800
Orta: Home | Services | Stylists | Contact (anchor linkler)
  - Aktif: text-sky-700 font-semibold border-b-2 border-sky-700
  - Pasif: text-slate-500 hover:text-sky-600 transition-colors
Sağ:
  - "Track Appointment" — text butonu
  - "Book Now" → /book — bg-primary text-on-primary px-6 py-2.5 rounded-full
```

### Hero Section Detayı

```
Layout: relative min-h-screen flex items-center pt-20 overflow-hidden

Arka Plan:
  <div className="absolute inset-0 z-0">
    {/* Gradient overlay — solu opak, sağı şeffaf */}
    <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10" />
    {/* Berber salonu fotoğrafı */}
    <img className="w-full h-full object-cover" src="[unsplash-url]" />
  </div>

İçerik (z-20, max-w-2xl):
  Badge: inline-block px-4 py-1.5 rounded-full bg-secondary-container 
         text-on-secondary-container text-sm font-bold tracking-widest uppercase
         → "EXCELLENCE IN GROOMING"
  
  H1: text-6xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1]
      → "Your Morning <br/> <span className="text-primary">Ritual</span> Redefined."
  
  P: text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed
  
  Butonlar (flex gap-4):
    - [Book Now]: bg-primary text-on-primary px-8 py-4 rounded-full text-lg font-bold
                  shadow-lg shadow-primary/20 hover:bg-primary-dim
                  onClick={() => navigate('/book')}
    
    - [View Services]: bg-surface-container-lowest text-primary px-8 py-4 rounded-full
                       onClick={() => scrollTo('#services')}
```

### Services Section Detayı

```
Arka plan: bg-surface-container py-32

Başlık Alanı (flex justify-between items-end mb-16):
  Sol: H2 text-4xl font-extrabold tracking-tight text-on-surface
       P text-on-surface-variant
  Sağ: "View All Services →" link

Bento Grid (grid grid-cols-1 md:grid-cols-2 gap-6):
  Kart 1 — Normal (col-span-1):
    bg-surface-container-lowest rounded-[2rem] p-8
    İkon + İsim + Fiyat + Açıklama + Süre + Tag

  Kart 2 — Vurgu (col-span-1, farklı renk):
    bg-tertiary-container rounded-[2rem] p-8
    
  Kart 3 — Tam genişlik Featured:
    md:col-span-2 bg-primary text-on-primary rounded-[2rem] p-8
    İçinde [Book Package] butonu
    Sağda dekoratif daire/yıldız şekli

HİZMETLER BACKEND'DEN GELECEK:
  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices);
  }, []);
```

### Stylists Section Detayı

```
H2 + açıklama
4'lü grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8)

Her berber kartı:
  - relative overflow-hidden rounded-[2rem]
  - Fotoğraf: grayscale group-hover:grayscale-0 transition-all duration-500
  - Alt glass overlay: absolute bottom-4 left-4 right-4
    glass-card bg-white/70 backdrop-blur-md rounded-full p-4
    → İsim + Unvan + Rating

BERBERLER BACKEND'DEN GELECEK:
  fetch('/api/barbers') → name, photoUrl, level, speciality
```

### CTA Section Detayı

```
bg-surface-container-lowest (veya gradient) rounded-[2rem] mx-8 mb-16 p-16
Flex justify-between items-center

Sol:
  H2: text-4xl font-extrabold text-on-surface
      → "Ready to find your sanctuary?"
  P: text-on-surface-variant

Sağ:
  Button: bg-primary text-on-primary px-10 py-5 rounded-full text-lg font-bold
          shadow-xl shadow-primary/25
          onClick={() => navigate('/book')}
```

---

## 🔵 PHASE 3: BookingPage.jsx — `/book` Route

**Referans dosya:** `book_your_transformation_guest_only_no_buttons/code.html`

**Layout:**

```jsx
// src/pages/BookingPage.jsx
// State: selectedService, selectedBarber, selectedDate, selectedSlot
// ayrıca: name, phone, isSubmitting, bookingResult, showModal

return (
  <div className="bg-surface min-h-screen">
    <Navbar />
    <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Başlık */}
      <header className="mb-12">
        <Badge>Instant Guest Booking • No Login Required</Badge>
        <h1>Book Your Transformation</h1>
        <p>...</p>
      </header>

      {/* 12 kolon grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sol — Hizmet + Berber seçimi */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          <ServiceSelector />    {/* Step 1 */}
          <StylistSelector />    {/* Step 2 */}
          <CustomerInfoForm />   {/* Step 3 — isim + telefon */}
        </section>

        {/* Sağ — Takvim + Saat + Fiyat (STICKY) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28">
            <ScheduleSelector />
          </div>
        </aside>

      </div>
    </main>

    {/* Confirm Modal */}
    {showConfirm && <BookingConfirmModal />}
  </div>
);
```

### Step 1 — Service Selector Detayı

```
Kapsayıcı: bg-surface-container-low p-8 rounded-[2rem]

Başlık:
  H2 flex items-center gap-3:
    <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">1</span>
    Select Curated Service

Kart Grid (grid grid-cols-1 md:grid-cols-2 gap-4):
  Pasif kart:
    bg-surface-container-lowest p-6 rounded-full
    border border-transparent hover:border-primary-fixed-dim
    transition-all cursor-pointer shadow-sm
    + group hover overlay: absolute inset-0 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100
  
  Aktif kart (selectedService === service.id):
    bg-primary/5 border-primary-fixed-dim (veya ring-2 ring-primary)

  İçerik:
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xl font-bold text-on-surface">{service.name}</h3>
      <span className="text-primary font-bold">₺{service.price}</span>
    </div>
    <p className="text-on-surface-variant text-sm mb-4">{service.description}</p>
    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
      <span><material-icon>schedule</material-icon> {service.duration} dk</span>
    </div>

DATA: useEffect → fetch('/api/services')
```

### Step 2 — Stylist Selector Detayı

```
Kapsayıcı: bg-surface-container-low p-8 rounded-[2rem]

Başlık: "2" badge + "Choose Your Stylist"

Yatay scroll (flex overflow-x-auto gap-6 pb-4 no-scrollbar):
  Her kart (min-w-[220px] relative rounded-[1.5rem] overflow-hidden cursor-pointer):
    - Fotoğraf: w-full h-64 object-cover
    - Eğer seçiliyse: ring-4 ring-primary
    
    - Alt glass overlay (absolute bottom-0 left-0 right-0 glass-card p-4 rounded-b-[1.5rem]):
      bg-white/70 backdrop-blur-md
      İsim (font-bold) + Unvan (text-xs text-on-surface-variant)
      
    - Level badge (absolute top-4 left-4):
      bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-bold uppercase
      → "MASTER" / "SENIOR" / "DIRECTOR"

    - Seçim checkbox (absolute top-4 right-4):
      Seçiliyse: bg-primary rounded-full → checkmark
      Değilse: gizli

DATA: useEffect → fetch('/api/barbers')
```

### Step 3 — Schedule Selector Detayı (Sağ sticky panel)

```
Kapsayıcı: bg-surface-container-low p-6 rounded-[2rem]

Başlık: "3" badge + "Select Schedule"

Mini Takvim:
  Başlık: "October 2024" + < > butonları (chevron_left / chevron_right material icons)
  
  Gün başlıkları satırı (grid grid-cols-7):
    S M T W T F S — text-xs text-on-surface-variant font-bold text-center
  
  Günler (grid grid-cols-7 mt-2 gap-1):
    Pasif gün: h-10 w-10 rounded-full flex items-center justify-center text-sm hover:bg-surface-container
    Aktif gün: bg-primary text-on-primary rounded-full
    Geçmiş günler: opacity-40 cursor-not-allowed

Saat Slotları ("AVAILABLE TIMES" başlığı altında):
  Grid (grid grid-cols-2 gap-2 mt-4):
    Müsait: border border-outline-variant rounded-xl py-2 text-center text-sm
            hover:border-primary hover:bg-primary/5 cursor-pointer
    Dolu: opacity-40 bg-surface-container cursor-not-allowed line-through
    Seçili: bg-primary text-on-primary border-primary

Fiyat Özeti:
  Ayırıcı çizgi YOK (surface shift yeterli)
  "ESTIMATED TOTAL" — text-xs uppercase tracking-widest text-on-surface-variant
  Fiyat — text-3xl font-extrabold text-on-surface
  "Tax included" — text-xs text-on-surface-variant text-right

CTA Butonu:
  w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-base
  shadow-lg shadow-primary/20 hover:bg-primary-dim
  disabled hali: opacity-50 cursor-not-allowed
  → onClick: slot + berber + hizmet seçiliyse → CustomerInfoModal aç

DATA:
  useEffect → fetch(`/api/appointments/availability?barberId=${selectedBarber}&date=${selectedDate}`)
  Seçili berber veya tarih değişince yeniden fetch
```

### Customer Info Modal Detayı

```
Overlay: fixed inset-0 bg-black/40 backdrop-blur-xl z-50

Modal box: bg-surface-container-lowest rounded-[2rem] p-8 max-w-md w-full ambient-shadow

İçerik:
  H2: "Confirm Your Booking"
  
  Rezervasyon özeti kartı (bg-surface-container-low rounded-xl p-4 mb-6):
    Hizmet + Berber + Tarih/Saat + Fiyat
  
  Form (flex flex-col gap-4):
    İsim input:
      bg-surface-container-low border-none rounded-xl px-4 py-3
      focus:ring-2 focus:ring-surface-tint/20
      placeholder: text-on-surface-variant
    
    Telefon input:
      Aynı stil + 05xxxxxxxxx placeholder + validation
    
    HONEYPOT (ZORUNLU — görünmez):
      <input type="text" name="website" style={{display:'none'}} tabIndex={-1} />
    
    Submit butonu:
      bg-primary text-on-primary w-full py-4 rounded-xl font-bold
      Loading state: "Randevu Oluşturuluyor..."
      Başarı: redirect /track?id=XXX

HATA gösterimi:
  Kırmızı banner (bg-error-container text-on-error-container rounded-xl p-3)
  DEĞİL pop-up/alert — inline'da göster
```

---

## 🔵 PHASE 4: Admin Layout + Sidebar

**Referans dosya:** `simplified_admin_dashboard/code.html` + `appointments_management/code.html`

```jsx
// src/layouts/AdminLayout.jsx
// React Router Outlet ile çalışır
// App.jsx'te:
// <Route path="/admin" element={<AdminLayout />}>
//   <Route index element={<DashboardPage />} />
//   <Route path="appointments" element={<AppointmentsPage />} />
//   <Route path="services" element={<ServicesPage />} />
//   <Route path="stylists" element={<StylistsPage />} />
//   <Route path="settings" element={<SettingsPage />} />
// </Route>

export default function AdminLayout({ onLogout, currentUser }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar onLogout={onLogout} currentUser={currentUser} />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Detayı

```
aside: h-screen w-64 fixed left-0 top-0
       border-r border-slate-200/20 bg-slate-50
       flex flex-col py-6 z-50

Logo Alanı (px-6 mb-10):
  Daire ikon (w-10 h-10 rounded-full bg-primary):
    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>spa</span>
  Sağ:
    "HairMan Admin" — text-lg font-extrabold text-blue-800
    "The Digital Sanctuary" — text-xs text-on-surface-variant

Nav Linkleri (flex-grow space-y-1 px-4):
  Pasif link:
    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
    text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-all
  
  Aktif link (NavLink isActive):
    bg-blue-50 text-blue-700 rounded-xl font-semibold

  Link listesi:
    dashboard     → Dashboard
    calendar_month → Appointments
    content_cut   → Services
    face          → Stylists
    payments      → Financials
    settings      → Settings

Alt Bölüm (px-4 mt-auto):
  Ayırıcı: h-px bg-slate-200/50
  
  Book New Session butonu:
    w-full py-4 bg-primary text-on-primary rounded-xl font-bold
    shadow-lg shadow-primary/20 flex items-center justify-center gap-2
    → /book'a yönlendir veya QuickBookModal aç
  
  Logout linki:
    flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-error
    material icon: logout
```

### TopBar Detayı

```
header: w-full sticky top-0 z-40
        bg-slate-50/80 backdrop-blur-xl
        flex justify-between items-center px-8 py-3
        border-b border-slate-200/10 shadow-sm shadow-blue-900/5

Sol: Arama input
  relative w-96
  <span material-icon="search" absolute left-3 />
  <input bg-surface-container-low border-none rounded-full py-2 pl-10 />

Sağ:
  Bildirim butonu (relative):
    p-2 text-slate-500 hover:bg-slate-100 rounded-full
    Yeni randevu varsa: absolute top-2 right-2 w-2 h-2 bg-error rounded-full
  
  Ayırıcı: h-8 w-px bg-slate-200
  
  Kullanıcı bilgisi + avatar:
    text-right:
      "Admin User" — text-xs font-bold text-on-surface
      "Master Manager" — text-[10px] text-on-surface-variant uppercase tracking-widest
    <img w-9 h-9 rounded-full border-2 border-primary-container />
```

---

## 🔵 PHASE 5: Admin Dashboard — `/admin`

**Referans dosya:** `simplified_admin_dashboard/code.html`

```
Layout (p-10 space-y-10):

Başlık (flex justify-between items-end):
  Sol: H2 "Dashboard Overview" + P alt yazı
  Sağ: [Export Report] + [Live View] butonları

Revenue Card (FULL WIDTH):
  bg-primary text-on-primary p-8 rounded-[2rem]
  shadow-2xl shadow-primary/10 min-h-[200px] relative overflow-hidden
  
  İçerik (relative z-10):
    "MONTHLY REVENUE" — text-on-primary/70 text-sm uppercase tracking-wide
    Trend badge: bg-on-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-xs
                 material icon: trending_up + "%15"
    Para: text-6xl font-extrabold mt-4 (backend'den gelir)
    Alt yazı: text-on-primary/60 text-sm
  
  Dekoratif arka plan:
    absolute -bottom-10 -right-10 w-48 h-48 bg-on-primary/10 rounded-full blur-3xl

3 Kolon Grid (grid grid-cols-1 lg:grid-cols-3 gap-10):
  Sol (col-span-2): Haftalık randevu bar chart
    bg-surface-container-lowest rounded-[2rem] p-6
    recharts BarChart veya basit SVG
    
  Sağ: Today's Schedule
    bg-surface-container-lowest rounded-[2rem] p-6
    Randevu listesi (bugüne filtreleme)
    Her randevu:
      flex items-center gap-4 py-3 (divider YOK, sadece gap)
      Saat badge + İsim + Hizmet + Durum chip

Alt 2 kart (grid grid-cols-2 gap-6):
  New Clients This Week + Average Rating
  Her biri: bg-secondary-container rounded-[2rem] p-6

DATA: useEffect → fetch('/api/auth/dashboard', { headers: authHeaders() })
```

---

## 🔵 PHASE 6: Appointments Page — `/admin/appointments`

**Referans dosya:** `appointments_management/code.html`

```
Başlık + [+ Add Appointment] butonu

Filter tabs (flex gap-2):
  All | Pending | Confirmed | Completed | Cancelled
  Aktif tab: bg-primary text-on-primary rounded-full px-4 py-1.5 text-sm font-bold
  Pasif tab: bg-surface-container text-on-surface-variant rounded-full px-4 py-1.5

Randevu Tablosu:
  bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow
  
  Tablo başlığı (table header):
    bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant
    Sütunlar: TIME | CLIENT | STYLIST | SERVICE | STATUS | ACTIONS
  
  Her satır (hover:bg-surface-container-low):
    TIME: font-bold text-on-surface + tarih (text-xs text-on-surface-variant)
    CLIENT: İsim + Telefon (text-xs)
    STYLIST: Avatar (w-7 h-7 rounded-full) + İsim
    SERVICE: Hizmet adı
    STATUS chip:
      pending:   bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs font-bold
      confirmed: bg-green-100 text-green-700 rounded-full ...
      rejected:  bg-error-container text-on-error-container rounded-full ...
      completed: bg-surface-container text-on-surface-variant rounded-full ...
    ACTIONS: 3 nokta menü veya inline butonlar

Appointment Modal (Add/Edit):
  Aynı modal pattern
  Form: Client Name + Phone + Service (dropdown) + Barber (dropdown) + Date + Time
  Backend: POST /api/appointments veya PATCH /api/appointments/:id
  DELETE: Silme onay dialog'u

BACKEND NOT: DELETE /api/appointments/:id endpoint'i eklenmeli
```

---

## 🔵 PHASE 7: Services Page — `/admin/services`

**Referans dosya:** `service_management_no_inventory/code.html`

```
Başlık + [+ Add New Service] butonu

Üst Metrik Kartları (grid grid-cols-3 gap-6):
  Aylık Gelir + Aktif Hizmet Sayısı + En Çok Tercih Edilen

Hizmetler Tablosu:
  bg-surface-container-lowest rounded-[2rem]
  
  Her hizmet satırı:
    İkon (material symbol, kategori bazlı) + İsim + Açıklama
    Kategori chip (bg-secondary-container text-on-secondary-container rounded-full)
    Fiyat (font-bold text-primary)
    Süre
    [Edit] [Delete] butonları

Service Modal:
  H3: "Add New Service" veya "Edit Service"
  Form inputs (bg-surface-container-low rounded-xl):
    - Service Name (text input)
    - Category (select: BARBERING / GROOMING / TREATMENTS)
    - Price (number input, ₺ prefix)
    - Duration (number input, "minutes" suffix)
    - Description (textarea)
    - Active toggle (switch)
  
  Butonlar:
    [Cancel] — bg-surface-container text-on-surface
    [Save] — bg-primary text-on-primary

BACKEND: GET/POST/PATCH/DELETE /api/services (hepsi eklenecek)
PRISMA: Service model eklenmeli (name, price, duration, category, description, isActive)
```

---

## 🔵 PHASE 8: Stylists Page — `/admin/stylists`

**Referans dosya:** `team_management/code.html`

```
Başlık + [+ Add New Stylist] butonu + Search input

Berber Grid (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6):
  Her kart (bg-surface-container-lowest rounded-xl p-6 shadow-sm group hover:shadow-md):
    Fotoğraf: w-20 h-20 rounded-xl object-cover
              grayscale group-hover:grayscale-0 transition-all duration-500
    Status dot: absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4
                Yeşil (aktif) / Amber (molada) / Slate (izinde)
    
    Level badge: px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold 
                 uppercase tracking-wider rounded-full
    
    İsim + Unvan (text-on-surface-variant text-sm)
    Uzmanlık alanı
    
    İstatistik kartları (grid grid-cols-2 gap-2 mt-4):
      bg-surface-container-low p-3 rounded-xl
      "Bu Ay" randevu sayısı + Ortalama puan
    
    Butonlar (flex gap-2 mt-4):
      [Edit Profile] — bg-slate-100 hover:bg-slate-200 text-on-surface-variant
      [Schedule] — bg-blue-50 hover:bg-blue-100 text-primary
      [Delete] — text-error hover:bg-error-container/20 (confirm dialog ile)

Stylist Modal (Add/Edit):
  H3: "Onboard New Stylist" veya "Edit Stylist"
  
  Fotoğraf Upload Alanı:
    border-2 border-dashed border-outline-variant rounded-[2rem] p-8 text-center
    material icon: add_photo_alternate (büyük)
    "Drag & drop or click to upload" metni
    Önizleme: seçilince dashed border kalkar, fotoğraf gösterilir
    Fallback: default avatar (ilk harf daire)
  
  Form:
    - Full Name (input)
    - Title/Specialty (input — "Fade Expert", "Color Specialist")
    - Level (select: JUNIOR / SENIOR / MASTER / DIRECTOR)
    - Username (input — login için)
    - Password (input — yeni eklemede zorunlu, editde opsiyonel)
    - Phone (input)
  
  Submit: FormData (multipart) → POST /api/barbers veya PATCH /api/barbers/:id

BACKEND DEĞİŞİKLİKLERİ:
  - multer kurulumu (fotoğraf upload)
  - /uploads/barbers/ klasörü (static serve)
  - Barber model'e: photoUrl, level, speciality alanları
  - DELETE /api/barbers/:id CORS fix
```

---

## 🔵 PHASE 9: Settings Page — `/admin/settings`

**Referans dosya:** `salon_settings_updated_hours/code.html`

```
Salon adı, çalışma saatleri, iletişim bilgileri
Berber ses bildirimleri ayarları (mevcut soundType)

Çalışma Saatleri Tablosu:
  Her gün için: Açık/Kapalı toggle + Açılış saati + Kapanış saati
  bg-surface-container-lowest rounded-xl p-6

Save butonu: bg-primary ... w-full rounded-xl
```

---

## 🔵 PHASE 10: Barber Panel — `/berber`

**YENİ, sıfırdan yazılacak:**

```
Sidebar (basitleştirilmiş — sadece berberlik ihtiyaçları):
  Logo + Berber adı
  Nav: 📅 Today's Schedule | 🔔 Pending | ⚙️ Settings
  Ses aktif/pasif toggle
  Logout

Ana İçerik:
  Bugün (tarih başlığı)
  
  Bekleyen Randevular Bölümü (kırmızı badge + sayı):
    Her randevu kartı:
      Saat badge (bg-primary text-on-primary rounded-xl)
      Müşteri adı + telefon
      Hizmet adı
      [Onayla] green | [Reddet] error butonları
  
  Onaylı Randevular:
    Aynı kart yapısı + [Tamamla] butonu
  
  Tamamlanan Randevular (gri, collapsed):
    "5 completed today" → tıkla genişlet

ÖNEMLI KISITLAMA:
  Backend: GET /api/appointments → sadece o berberin randevuları
  barberId = currentUser.barberId filtrelemesi server-side yapılmalı
```

---

## 🔵 PHASE 11: Track Page — `/track`

**Referans dosya:** `track_appointment_no_login/code.html`

```
Navbar (sağda: Book Now + Track Appointment aktif)

grid grid-cols-1 lg:grid-cols-12 gap-12:
  Sol (col-span-5): Randevu sorgulama formu
    H1 "Track Your Appointment"
    
    2'li stat grid:
      Appointment ID kartı (bg-surface-container-low rounded-full p-6)
      Berber kartı (bg-surface-container p-1 rounded-full + avatar)
    
    Randevu bilgileri (bg-surface-container-highest rounded-full p-8)
    
    Yeniden Planla kartı (flex justify-between items-center):
      "Need to reschedule?" metni + butonu
  
  Sağ (col-span-7): Arama formu
    Randevu ID input + [Search] butonu
    Sonuç: status timeline (pending → confirmed → completed)
    
    Status Timeline:
      Pending:   amber daire + "Awaiting confirmation"
      Confirmed: blue daire + "Appointment confirmed"  
      Completed: green daire + "Service completed"
      Rejected:  red daire + "Unfortunately rejected"
```

---

## 🔵 PHASE 12: Login Page — `/login`

**Tasarım referansı yok, sıfırdan yaz:**

```
Full-screen: bg-surface flex items-center justify-center min-h-screen

Kart (bg-surface-container-lowest rounded-[2rem] p-12 max-w-md w-full ambient-shadow):
  Logo + "HairMan Studio"
  H2: "Welcome back"
  P: "Sign in to access your panel"
  
  Form:
    Username input (bg-surface-container-low rounded-xl px-4 py-3 border-none)
    Password input (aynı + show/hide toggle)
    
    Error state: bg-error-container text-on-error-container rounded-xl p-3
    
    [Sign In] butonu: bg-primary text-on-primary w-full py-4 rounded-xl font-bold
                      Loading: spinner animasyonu
  
  Alt: "Müşteri misiniz? Randevu almak için →" link

LOGIN sonrası yönlendirme:
  ADMIN → /admin
  BARBER → /berber
```

---

## ⚡ BACKEND DEĞİŞİKLİKLERİ ÖZETİ

```javascript
// 1. CORS FIX (hemen yap)
app.options('*', cors(corsOptions));
methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']

// 2. Service CRUD endpoints
GET    /api/services
POST   /api/services       (ADMIN only)
PATCH  /api/services/:id   (ADMIN only)
DELETE /api/services/:id   (ADMIN only)

// 3. Barber endpoints
PATCH  /api/barbers/:id    (ADMIN only) — fotoğraf dahil
DELETE /api/barbers/:id    (ADMIN only) — CORS fix ile

// 4. Appointment DELETE
DELETE /api/appointments/:id (ADMIN only)

// 5. Barber kendi randevularını görsün
GET /api/appointments → barberId filter:
  if (userRole === 'BARBER') {
    where = { barberId: currentUser.barberId }
  }

// 6. Multer (fotoğraf upload)
npm install multer
app.use('/uploads', express.static('uploads'))

// 7. Prisma Schema güncellemeleri
model Service { id, name, description, price, duration, category, isActive, createdAt }
model Barber'a ekle: { photoUrl, level, speciality }
```

---

## 📋 YAPAY ZEKAYA KOD YAZDIRIRKEN ŞABLONLAR

### Her prompt'un başına yapıştır:

```
DESIGN SYSTEM:
- Font: Manrope (tüm text'lerde)
- İkonlar: Material Symbols Outlined (<span className="material-symbols-outlined">icon_name</span>)
- Renkler Tailwind token'ları: text-on-surface (#2c3437), text-primary (#0060ad), bg-surface (#f7f9fb)
- KURAL: 1px solid border ile section AYIRMA — surface color shift kullan
- KURAL: Büyük componentler rounded-[2rem] veya rounded-full kullan (rounded/rounded-lg YASAK)
- KURAL: Pure black (#000) text YASAK — her zaman text-on-surface
- KURAL: Generic shadow YASAK — ambient: shadow-[0_20px_40px_rgba(0,96,173,0.06)]
- KURAL: Divider çizgi liste içinde YASAK
- Butonlar: rounded-full (pill)
- Modal overlay: fixed inset-0 bg-black/40 backdrop-blur-xl z-50
```

### Sıralama (Bu sırayla yaptır):

1. `index.html` güncellemesi (Tailwind config)
2. `src/index.css` güncellemesi
3. `src/layouts/AdminLayout.jsx` (sidebar + topbar)
4. `src/pages/LandingPage.jsx`
5. `src/pages/BookingPage.jsx`
6. `src/pages/LoginPage.jsx`
7. `src/pages/TrackPage.jsx`
8. `src/pages/admin/DashboardPage.jsx`
9. `src/pages/admin/AppointmentsPage.jsx`
10. `src/pages/admin/ServicesPage.jsx`
11. `src/pages/admin/StylistsPage.jsx`
12. `src/pages/admin/SettingsPage.jsx`
13. `src/pages/barber/BarberPanel.jsx`
14. `src/App.jsx` (routing'i güncelle)
15. Backend: CORS fix → Service endpoints → Multer → Prisma migration
