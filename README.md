# HairMan Studio | Premium Rezervasyon Sistemi

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

## Giriş ve Amaç

HairMan Studio, üst düzey berber salonları için tasarlanmış, gerçek zamanlı bildirimlere sahip ultra lüks bir rezervasyon yönetim sistemidir. "Midnight Gold" tasarım dili ile geliştirilen bu uygulama, hem müşteri hem de personel için birinci sınıf dijital deneyim sunmayı hedefler. Sistem, güvenli randevu yönetimi, akıllı bildirimler ve premium kullanıcı arayüzü ile salon operasyonlarını optimize eder.

**Mevcut Diller:**
- [Türkçe (Geçerli)](README.md)
- [English / İngilizce](README.tr.md)

---

## Hızlı Başlangıç

Projenizi hızlıca çalıştırmak için aşağıdaki adımları takip edin:

1. **Bağımlılıkları Yükleyin**:
   ```bash
   npm run install-all
   ```

2. **Veritabanını Hazırlayın**:
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

3. **Uygulamayı Başlatın**:
   - **Geliştirme Modu** (hot-reload, API proxy): `start-dev.bat` çalıştırın
   - **Üretim Modu** (production build, sıkı güvenlik): `start-prod.bat` çalıştırın

**Tarayıcıda Erişim**: http://localhost:5173 (geliştirme) veya http://localhost:4173 (üretim)

---

## Kurulum Gereksinimleri ve Adımları

### Sistem Gereksinimleri

- **Node.js**: 18.0 veya üzeri (JavaScript çalışma zamanı)
- **npm**: 9.0 veya üzeri (paket yöneticisi)
- **Git**: Sürüm kontrol sistemi
- **İşletim Sistemi**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Bellek**: Minimum 4GB RAM
- **Disk Alanı**: 500MB boş alan

### Platform Bağımlılıkları

- **Windows**: Powershell veya Command Prompt (varsayılan)
- **macOS/Linux**: Terminal uygulaması
- **Veritabanı**: SQLite (harici kurulum gerektirmez)

### Detaylı Kurulum Adımları

1. **Depoyu Klonlayın**:
   ```bash
   git clone <repo-url>
   cd hairdresser-reservation
   ```

2. **Ana Bağımlılıkları Yükleyin**:
   ```bash
   npm install
   ```
   *Bu komut kök dizindeki package.json'dan bağımlılıkları yükler.*

3. **Sunucu Bağımlılıklarını Yükleyin**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **İstemci Bağımlılıklarını Yükleyin**:
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Veritabanını Yapılandırın**:
   ```bash
   cd server
   npx prisma generate
   npm run db:migrate
   npm run db:seed
   cd ..
   ```
   *Bu adım veritabanı şemasını oluşturur ve örnek verilerle doldurur.*

6. **Ortam Değişkenlerini Yapılandırın**:
   `server/.env` dosyasını düzenleyin:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="change-me-to-a-long-random-secret-string-in-production"
   JWT_EXPIRES_IN="24h"
   ALLOWED_ORIGIN="http://localhost:5173"
   PORT=5000
   ```

---

## Çalıştırma ve Temel Kullanım

### Geliştirme Ortamı

Geliştirme modunda uygulama, otomatik yeniden yükleme ve API proxy ile çalışır:

```bash
start-dev.bat
```

*Terminal Çıktısı Örneği*:
```
=======================================================
        HairMan Studio - GELISTIRME (DEV) MODU
=======================================================

Dev ortaminda rate limitler esnektir ve hatalar gosterilir.

Portlar temizleniyor (5000, 5173)...
Server (Backend) baslatiliyor...
Client (Frontend) baslatiliyor...

Geliştirme ortamlari ayri pencerelerde baslatildi.
Uygulamaya gitmek icin: http://localhost:5173
```

### Üretim Ortamı

Üretim modunda güvenlik önlemleri sıkılaştırılır ve performans optimize edilir:

```bash
start-prod.bat
```

*Terminal Çıktısı Örneği*:
```
=======================================================
        HairMan Studio - CANLI (PROD) MODU
=======================================================

Prod ortaminda security (rate limit, CORS) sıkıdır.

Portlar temizleniyor (5000, 4173)...
Frontend (Client) proje derleniyor... (Build)
Server (Backend) baslatiliyor...
Client (Frontend) Prod ortaminda baslatiliyor...

Canli (Prod) sistemler ayri pencerelerde baslatildi.
Uygulamaya gitmek icin: http://localhost:4173
```

### Temel Kullanım

1. **Web Arayüzüne Erişim**: Tarayıcıda http://localhost:5173 açın
2. **Admin Girişi**: Varsayılan kullanıcı adı: `admin`, şifre: `admin123`
3. **Randevu Oluşturma**: Müşteri bilgileri girerek randevu alın
4. **Takip Kodu**: Randevu sonrası verilen 8 karakterli kodu kullanarak durumu takip edin

---

## Örnekler ve Komutlar

### Veritabanı İşlemleri

**Migration Oluşturma**:
```bash
cd server
npx prisma migrate dev --name yeni-ozellik
```

**Veritabanı Tarayıcısı**:
```bash
cd server
npm run db:studio
```
*Bu komut Prisma Studio'yu açar: http://localhost:5555*

### Test Çalıştırma

**Tüm Testleri Çalıştırın**:
```bash
cd server
npm test
```

*Çıktı Örneği*:
```
PASS src/controllers/appointment.controller.test.js
PASS src/services/timeSlots.test.js
Test Suites: 12 passed, 12 total
Tests: 45 passed, 45 total
```

### Build İşlemleri

**İstemci Build**:
```bash
cd client
npm run build
```

*Çıktı Örneği*:
```
vite v8.0.0 building for production...
✓ 124 modules transformed.
dist/index.html                 0.45 kB
dist/assets/index-D4s1MgPq.css  12.34 kB
dist/assets/index-Ba3nQw0M.js   234.56 kB
```

---

## Özellikler ve Mimariye Kısa Bakış

### Ana Özellikler

- **Lüks Görsel Tasarım**: "Midnight Gold" teması, Manrope tipografisi, derin glassmorphism efektleri
- **Askeri Düzey Güvenlik**: JWT (JSON Web Token) kimlik doğrulama, Helmet XSS/CSRF koruması, dinamik CORS kısıtlamaları
- **Akıllı Hız Sınırlaması**: Geliştirme ortamında esnek, üretimde brute-force koruması
- **Bot Koruması**: "Honeypot" mekanizması ile spam randevuların sessiz engellenmesi
- **SQLite & Prisma ORM**: Harici veritabanı gerektirmeyen, hızlı dosya tabanlı altyapı
- **Akıllı Polling**: Optimize edilmiş polling ve premium sesli bildirimlerle gerçek zamanlı güncellemeler
- **Randevu Takibi**: Müşterilerin durumunu güvenli takip edebilmesi için benzersiz 8 karakterli takip kodları
- **Güçlü Doğrulama**: Gelişmiş telefon maskeleme (0 (5xx) xxx xx xx) ve 11 haneli Türkiye mobil formatı doğrulaması
- **Sabit Çalışma Saatleri**: Hem frontend hem backend düzeyinde 08:30 - 19:00 çalışma saati kısıtlaması
- **Çok Kanallı Ses Sistemi**: Web Audio API veya özel .mp3 dosyaları ile premium bildirimler
- **%100 Mobil Uyumluluk**: Tüm ekran boyutlarında kusursuz çalışan responsive tasarım
- **Gelişmiş Loglama**: Sistem takibi için yapılandırılmış JSON loglama sistemi

### Mimari Genel Bakış

```
┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Express API   │
│   (Vite + TS)   │◄──►│  (Node.js)      │
│                 │    │                 │
│ - Components    │    │ - Controllers   │
│ - Pages         │    │ - Routes        │
│ - Services      │    │ - Middleware    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                 │
        ┌─────────────────┐
        │   SQLite DB     │
        │   (Prisma ORM)  │
        │                 │
        │ - Users         │
        │ - Appointments  │
        │ - Services      │
        │ - Settings      │
        └─────────────────┘
```

**Teknoloji Yığını**:
- **Frontend**: React (frontend kütüphanesi) + Vite (build tool) + Framer Motion (animasyon) + TailwindCSS (stil)
- **Backend**: Node.js (çalışma zamanı) + Express (web framework) + JWT (kimlik doğrulama) + Bcrypt (şifreleme)
- **Veritabanı**: SQLite3 + Prisma ORM (veritabanı araç seti)
- **Güvenlik**: Helmet.js, Express-Rate-Limit, CORS Protection, Validator.js
- **Test**: Jest (test framework) + Supertest (API test) + Vitest (frontend test)

---

## Katkıda Bulunma Yönergeleri

Bu projeye katkıda bulunmak için:

1. **Fork** edin ve kendi branch'inizde çalışın:
   ```bash
   git checkout -b feature/yeni-ozellik
   ```

2. **Kod Standartlarına Uyun**:
   - ESLint kurallarına uygun yazın
   - JSDoc yorumları ekleyin
   - Testler yazın

3. **Commit Mesajları**:
   - Türkçe veya İngilizce: "feat: yeni randevu özelliği eklendi"
   - Conventional commits formatı: `feat:`, `fix:`, `docs:`, `test:`

4. **Test Edin**:
   ```bash
   cd server && npm test
   cd ../client && npm run test
   ```

5. **Pull Request** oluşturun ve detaylı açıklama ekleyin.

**Geliştirme Ortamı Kurulumu**: Yukarıdaki kurulum adımlarını takip edin.

---

## Testler ve Kalite Güvence

### Test Çalıştırma

**Sunucu Testleri**:
```bash
cd server
npm test
```

**İstemci Testleri**:
```bash
cd client
npm run test
```

**Coverage Raporu**:
```bash
cd server
npm test -- --coverage
```

### Test Kategorileri

- **Unit Testler**: Bireysel fonksiyonları test eder
- **Integration Testler**: API uç noktalarını test eder
- **E2E Testler**: Tam kullanıcı akışlarını test eder

### Kalite Standartları

- **Kod Coverage**: Minimum %80 hedeflenir
- **Linting**: ESLint kuralları uygulanır
- **Type Checking**: TypeScript ile tip güvenliği
- **Security Audit**: npm audit ile bağımlılık güvenliği kontrolü

---

## Sürüm Notları ve Geçmişi

### v1.0.0 (2026-04-02)
- İlk kararlı sürüm
- Temel randevu yönetim sistemi
- Gerçek zamanlı bildirimler
- Güvenlik ve performans optimizasyonları

### v0.9.0 (2026-03-15)
- Beta sürüm
- Temel özelliklerin tamamlanması
- Test kapsamının genişletilmesi

### v0.1.0 (2026-01-01)
- İlk prototip
- Temel CRUD operasyonları
- Basit kullanıcı arayüzü

**Sürüm Geçmişi Detayları**: [CHANGELOG.md](CHANGELOG.md) dosyasında bulunabilir.

---

## Lisans ve Destek

### Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

### Destek ve İletişim

- **Geliştirici**: Oğuz Selman Çetin
- **E-posta**: destek@hairmanstudio.com
- **GitHub Issues**: [Sorun Bildir](https://github.com/username/hairdresser-reservation/issues)
- **Dokümantasyon**: [Wiki](https://github.com/username/hairdresser-reservation/wiki)

### SSS / Sorun Giderme

**Q: Port çakışması hatası alıyorum?**
A: Portları temizlemek için:
```bash
# Windows
FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :5000') DO taskkill /F /PID %P /T

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

**Q: Veritabanı bağlantı hatası?**
A: `.env` dosyasındaki `DATABASE_URL` değerini kontrol edin. Varsayılan: `"file:./dev.db"`

**Q: JWT secret hatası?**
A: Üretim ortamında güçlü bir secret belirleyin:
```env
JWT_SECRET="uzun-ve-guclu-bir-rastgele-string"
```

**Q: Build hatası alıyorum?**
A: Node.js sürümünüzü kontrol edin (minimum 18.0):
```bash
node --version
npm --version
```

**Q: Testler başarısız oluyor?**
A: Test ortamı için ayrı veritabanı kullanın:
```bash
cd server
NODE_ENV=test npm test
```

---

*Geliştiren: Oğuz Selman Çetin | 2026*
