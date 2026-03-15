# 🎩 Noir Barber | Premium Reservation System

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

**Noir Barber**, üst düzey bir berber deneyimi için tasarlanmış, gerçek zamanlı bildirimlere sahip, ultra lüks bir rezervasyon yönetim sistemidir. "Midnight Gold" tasarım diliyle hazırlanan bu uygulama, hem müşteri hem de berber için birinci sınıf bir dijital deneyim sunar.

## ✨ Öne Çıkan Özellikler

- **💎 Luxury Visuals**: "Midnight Gold" teması, Cinzel tipografisi ve derinlikli glassmorphism efektleri.
- **🔔 Gerçek Zamanlı Bildirimler**: Soket entegrasyonu sayesinde randevular anında admin paneline düşer.
- **🔊 Akıllı Ses Sistemi**: Web Audio API (Dijital Sentezleyici) kullanılarak internete bağımlı olmayan, güvenilir bildirim sesleri.
- **📱 Her Yerden Erişim**: Mobilden veya bilgisayardan yerel ağ üzerinden erişim desteği.
- **🌍 Çoklu Dil Desteği**: Türkçe ve İngilizce dil seçeneği (Varsayılan: Türkçe).
- **🎶 Özelleştirilebilir Sesler**: `/client/public/sounds/notification.mp3` yoluna kendi ses dosyanızı ekleyerek bildirim sesini değiştirebilirsiniz (Eğer dosya yoksa, sistem lüks bir "Dijital Çan" sesi çalar).
- **🛠️ Güvenli Onay Mekanizması**: Berbere özel manuel randevu onay/red süreçleri.

## 🚀 Hızlı Başlangıç

Sistemi bilgisayarında çalıştırmak için şu adımları izle:

1.  **Bağımlılıkları Yükle**:
    ```bash
    npm run install-all
    ```
2.  **Sistemi Başlat**:
    *   **Geliştirme Modu (Hot-Reload, Esnek Limitler):** Proje dizininde `start-dev.bat` dosyasını çalıştırın. Sisteme `http://localhost:5173` adresinden erişilir.
    *   **Canlı Mod (Production Build, Sıkı Güvenlik):** Proje dizininde `start-prod.bat` dosyasını çalıştırın. Sisteme `http://localhost:4173` adresinden erişilir.

## 🛠️ Teknoloji Yığını

- **Frontend**: React (Vite) + Framer Motion (Orkestral Animasyonlar)
- **Backend**: Node.js + Express (Özel API Katmanı)
- **İletişim**: Socket.io (Gerçek Zamanlı Veri Akışı)
- **Stil**: Modern Vanilla CSS (Custom Design System)

## 🎨 Tasarım Vizyonu

Bu proje, bir "Minimum Viable Product" olmanın ötesinde, **lüks bir marka deneyimi** olarak kurgulanmıştır. Karanlık modun asaletini altın sarısı detaylarla birleştirir ve akıcı mikro-animasyonlarla kullanıcıyı etkilemeyi hedefler.

---
*Geliştiren: Antigravity AI | 2026*
