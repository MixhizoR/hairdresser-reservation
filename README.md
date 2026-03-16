# 🎩 Noir Barber | Premium Reservation System

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

**Noir Barber**, üst düzey bir berber deneyimi için tasarlanmış, gerçek zamanlı bildirimlere sahip, ultra lüks bir rezervasyon yönetim sistemidir. "Midnight Gold" tasarım diliyle hazırlanan bu uygulama, hem müşteri hem de berber için birinci sınıf bir dijital deneyim sunar.

## ✨ Öne Çıkan Özellikler

- **💎 Luxury Visuals**: "Midnight Gold" teması, Cinzel tipografisi ve derinlikli glassmorphism efektleri.
- **🛡️ Askeri Düzey Güvenlik**: JWT (JSON Web Token) kimlik doğrulama, Helmet xss/csrf korumaları, dinamik CORS kısıtlamaları.
- **⚡ Akıllı Hız Sınırları**: Geliştirme (Dev) ortamında esnek, Canlı (Prod) ortamda ise Brute-force saldırılarına karşı sıkı Rate Limiting kuralları.
- **🤖 Bot Koruması**: "Honeypot" mekanizması ile spam randevuların sessizce engellenmesi.
- **💾 SQLite & Prisma ORM**: Harici veritabanı kurulumu gerektirmeyen, dosya tabanlı, ultra hızlı ve güvenilir altyapı.
- **🔔 Gerçek Zamanlı Dashboard**: Socket.io entegrasyonu sayesinde yeni randevular ve durum güncellemeleri anında senkronize olur.
- **🔊 Çok Kanallı Ses Sistemi**: Web Audio API (Dijital Sentezleyici) veya özel yüklenebilir `.mp3` sesleri ile premium bildirimler.
- **📱 %100 Mobil Uyumluluk**: Tüm ekran boyutlarında kusursuz çalışan, modern grid yapıları ve responsive tasarım.
- **🛠️ 3-Aşamalı Randevu Akışı**:
  - 🟢 **Müsait**: Rezerve edilebilir boş saatler.
  - 🟠 **Bekliyor (Pending)**: Müşteri talebi alınmış, berber onayı bekleyen turuncu renkli slotlar.
  - 🔴 **Dolu (Approved)**: Berber tarafından onaylanmış, kesinleşmiş randevular.
- **📝 Gelişmiş Loglama**: Hata ayıklama ve sistem takibi için yapılandırılmış JSON loglama sistemi.

## 🚀 Hızlı Başlangıç

Sistemi bilgisayarında çalıştırmak için şu adımları izle:

1.  **Bağımlılıkları Yükle**:
    ```bash
    npm run install-all
    ```
2.  **Veritabanını Hazırla (İlk Kurulum)**:
    ```bash
    cd server
    npm run db:migrate
    npm run db:seed
    cd ..
    ```
3.  **Sistemi Başlat**:
    *   **Geliştirme Modu (Hot-Reload, API Proxy):** Proje dizininde `start-dev.bat` dosyasını çalıştırın. Vite proxy sayesinde `/api` istekleri otomatik olarak arka uca yönlendirilir.
    *   **Canlı Mod (Production Build, Sıkı Güvenlik):** Proje dizininde `start-prod.bat` dosyasını çalıştırın.

## 🛠️ Teknoloji Yığını

- **Frontend**: React (Vite) + Framer Motion (Orkestral Animasyonlar) + Lucide Icons
- **Backend**: Node.js + Express + JWT (Bcrypt Auth) + Socket.io
- **Veritabanı**: SQLite3 + Prisma ORM
- **Güvenlik**: Helmet.js, Express-Rate-Limit, CORS Protection, Input Validation (Validator.js)
- **Stil**: Modern Vanilla CSS (Custom Design System + Fluid Layouts)

## 🎨 Tasarım Vizyonu

Bu proje, bir "Minimum Viable Product" olmanın ötesinde, **lüks bir marka deneyimi** olarak kurgulanmıştır. Karanlık modun asaletini altın sarısı detaylarla birleştirir ve akıcı mikro-animasyonlarla kullanıcıyı etkilemeyi hedefler.

---
*Geliştiren: Oğuz Selman Çetin | 2026*

