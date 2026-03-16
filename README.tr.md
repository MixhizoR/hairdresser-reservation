# HairMan Studio | Premium Rezervasyon Sistemi

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

HairMan Studio, üst düzey bir berber deneyimi için tasarlanmış, gerçek zamanlı bildirimlere sahip, ultra lüks bir rezervasyon yönetim sistemidir. "Midnight Gold" tasarım diliyle hazırlanan bu uygulama, hem müşteri hem de berber için birinci sınıf bir dijital deneyim sunar.

---

**Mevcut Diller:**
- [English / İngilizce](README.md)
- [Türkçe (Geçerli)](README.tr.md)

---

## Özellikler

- **Lüks Görseller**: "Midnight Gold" teması, Cinzel tipografisi ve derin glassmorphism efektleri.
- **Askeri Düzey Güvenlik**: JWT (JSON Web Token) kimlik doğrulama, Helmet xss/csrf korumaları ve dinamik CORS kısıtlamaları.
- **Akıllı Hız Sınırları**: Geliştirme ortamında esnek, Canlı ortamda ise Brute-force saldırılarına karşı sıkı Rate Limiting kuralları.
- **Bot Koruması**: "Honeypot" mekanizması ile spam randevuların sessizce engellenmesi.
- **SQLite & Prisma ORM**: Harici veritabanı kurulumu gerektirmeyen, dosya tabanlı ve hızlı altyapı.
- **Gerçek Zamanlı Dashboard**: Socket.io entegrasyonu sayesinde randevular ve durum güncellemeleri anında senkronize olur.
- **Çok Kanallı Ses Sistemi**: Web Audio API veya özel `.mp3` sesleri ile premium bildirimler.
- **%100 Mobil Uyumluluk**: Tüm ekran boyutlarında kusursuz çalışan responsive tasarım.
- **3-Aşamalı Randevu Akışı**:
  - 🟢 **Müsait**: Rezerve edilebilir boş saatler.
  - 🟠 **Bekliyor**: Müşteri talebi alınmış, onay bekleyen slotlar.
  - 🔴 **Dolu/Onaylı**: Kesinleşmiş randevular.
- **Gelişmiş Loglama**: Sistem takibi için yapılandırılmış JSON loglama sistemi.

## Hızlı Başlangıç

1.  **Bağımlılıkları Yükle**:
    ```bash
    npm run install-all
    ```
2.  **Veritabanını Hazırla**:
    ```bash
    cd server
    npm run db:migrate
    npm run db:seed
    cd ..
    ```
3.  **Sistemi Başlat**:
    *   **Geliştirme Modu:** `start-dev.bat` dosyasını çalıştırın.
    *   **Canlı Mod:** `start-prod.bat` dosyasını çalıştırın.

## Teknoloji Yığını

- **Frontend**: React (Vite) + Framer Motion + Lucide Icons
- **Backend**: Node.js + Express + JWT (Bcrypt Auth) + Socket.io
- **Veritabanı**: SQLite3 + Prisma ORM
- **Güvenlik**: Helmet.js, Express-Rate-Limit, CORS Protection, Validator.js
- **Stil**: Modern Vanilla CSS (Custom Design System)

---
*Geliştiren: Oğuz Selman Çetin | 2026*
