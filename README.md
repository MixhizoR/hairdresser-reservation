# Noir Barber | Premium Reservation System

A high-end, real-time hairdresser reservation system built with React, Node.js, and Socket.io. This project features a luxury dark-themed UI, a secure admin dashboard, and instant audio-visual notifications for new bookings.

![Salon Hero](client/src/salon_hero_premium_1773576741628.png)

## ✨ Features

- 💎 **Premium UI/UX**: Noir-themed design with glassmorphism and smooth Framer Motion animations.
- ⚡ **Real-time Notifications**: Instant updates via Socket.io when a new reservation is made.
- 🔔 **Audio Alerts**: High-quality audio notifications for the admin dashboard.
- 🛡️ **Manual Approval**: Appointments are held in a "Pending" state until handled by the barber.
- 📱 **Responsive Design**: Fully optimized for mobile and desktop screens.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion, Lucide-React.
- **Backend**: Node.js, Express, Socket.io.
- **Styling**: Vanilla CSS (Custom Design System).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hairdresser-reservation.git
   cd hairdresser-reservation
   ```

2. Install all dependencies:
   ```bash
   npm run install-all
   ```

### Running the App

Start both the frontend and backend with a single command:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## 📂 Project Structure

- `/client`: React application (Vite).
- `/server`: Node.js Express server with Socket.io.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
