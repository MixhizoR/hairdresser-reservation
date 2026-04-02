# HairMan Studio | Premium Reservation System

![Midnight Gold Theme](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2000)

## Introduction and Purpose

HairMan Studio is an ultra-luxury reservation management system with real-time notifications, designed for high-end barber experiences. Developed with a "Midnight Gold" design language, this application provides a first-class digital experience for both customers and staff. The system optimizes salon operations with secure appointment management, smart notifications, and a premium user interface.

**Available Languages:**
- [English (Current)](README.tr.md)
- [Turkish / Türkçe](README.md)

---

## Quick Start

To quickly run your project, follow these steps:

1. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

2. **Initialize Database**:
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

3. **Run Application**:
   - **Development Mode** (hot-reload, API proxy): Run `start-dev.bat`
   - **Production Mode** (production build, strict security): Run `start-prod.bat`

**Browser Access**: http://localhost:5173 (development) or http://localhost:4173 (production)

---

## Installation Requirements and Steps

### System Requirements

- **Node.js**: 18.0 or higher (JavaScript runtime environment)
- **npm**: 9.0 or higher (package manager)
- **Git**: Version control system
- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Memory**: Minimum 4GB RAM
- **Disk Space**: 500MB free space

### Platform Dependencies

- **Windows**: Powershell or Command Prompt (default)
- **macOS/Linux**: Terminal application
- **Database**: SQLite (no external installation required)

### Detailed Installation Steps

1. **Clone Repository**:
   ```bash
   git clone <repo-url>
   cd hairdresser-reservation
   ```

2. **Install Main Dependencies**:
   ```bash
   npm install
   ```
   *This command installs dependencies from the root package.json.*

3. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Configure Database**:
   ```bash
   cd server
   npx prisma generate
   npm run db:migrate
   npm run db:seed
   cd ..
   ```
   *This step creates the database schema and populates it with sample data.*

6. **Configure Environment Variables**:
   Edit the `server/.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="change-me-to-a-long-random-secret-string-in-production"
   JWT_EXPIRES_IN="24h"
   ALLOWED_ORIGIN="http://localhost:5173"
   PORT=5000
   ```

---

## Running and Basic Usage

### Development Environment

In development mode, the application runs with automatic reloading and API proxy:

```bash
start-dev.bat
```

*Terminal Output Example*:
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

### Production Environment

In production mode, security measures are tightened and performance is optimized:

```bash
start-prod.bat
```

*Terminal Output Example*:
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

### Basic Usage

1. **Access Web Interface**: Open http://localhost:5173 in your browser
2. **Admin Login**: Default username: `admin`, password: `admin123`
3. **Create Appointment**: Enter customer information to book an appointment
4. **Tracking Code**: Use the 8-character code provided after booking to track status

---

## Examples and Commands

### Database Operations

**Create Migration**:
```bash
cd server
npx prisma migrate dev --name new-feature
```

**Database Browser**:
```bash
cd server
npm run db:studio
```
*This opens Prisma Studio at: http://localhost:5555*

### Running Tests

**Run All Tests**:
```bash
cd server
npm test
```

*Output Example*:
```
PASS src/controllers/appointment.controller.test.js
PASS src/services/timeSlots.test.js
Test Suites: 12 passed, 12 total
Tests: 45 passed, 45 total
```

### Build Operations

**Client Build**:
```bash
cd client
npm run build
```

*Output Example*:
```
vite v8.0.0 building for production...
✓ 124 modules transformed.
dist/index.html                 0.45 kB
dist/assets/index-D4s1MgPq.css  12.34 kB
dist/assets/index-Ba3nQw0M.js   234.56 kB
```

---

## Features and Architecture Overview

### Main Features

- **Luxury Visual Design**: "Midnight Gold" theme, Manrope typography, and deep glassmorphism effects
- **Military-Grade Security**: JWT (JSON Web Token) authentication, Helmet XSS/CSRF protection, and dynamic CORS restrictions
- **Intelligent Rate Limiting**: Flexible limits in development, strict brute-force protection in production
- **Bot Protection**: "Honeypot" mechanism silently blocks spam reservations
- **SQLite & Prisma ORM**: File-based, ultra-fast architecture without external database requirements
- **Smart Polling**: Real-time dashboard updates with optimized polling and premium audio notifications
- **Appointment Tracking**: Unique 8-character tracking codes for customers to securely monitor appointment status
- **Robust Validation**: Advanced phone masking (0 (5xx) xxx xx xx) and strict 11-digit Turkish mobile format validation
- **Hardcoded Operating Hours**: Strict 08:30 - 19:00 operating window enforced at both frontend and backend levels
- **Multi-Channel Audio**: Premium notifications using Web Audio API (Digital Synthesizer) or custom `.mp3` files
- **100% Mobile Responsive**: Seamless design across all screen sizes with modern grid structures
- **Advanced Logging**: Structured JSON logging system for debugging and system monitoring

### Architecture Overview

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

**Technology Stack**:
- **Frontend**: React (frontend library) + Vite (build tool) + Framer Motion (animation) + TailwindCSS (styling)
- **Backend**: Node.js (runtime) + Express (web framework) + JWT (authentication) + Bcrypt (encryption)
- **Database**: SQLite3 + Prisma ORM (database toolkit)
- **Security**: Helmet.js, Express-Rate-Limit, CORS Protection, Validator.js
- **Testing**: Jest (test framework) + Supertest (API testing) + Vitest (frontend testing)

---

## Contributing Guidelines

To contribute to this project:

1. **Fork** and work on your own branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Follow Code Standards**:
   - Write according to ESLint rules
   - Add JSDoc comments
   - Write tests

3. **Commit Messages**:
   - Turkish or English: "feat: added new appointment feature"
   - Conventional commits format: `feat:`, `fix:`, `docs:`, `test:`

4. **Test Your Changes**:
   ```bash
   cd server && npm test
   cd ../client && npm run test
   ```

5. **Create Pull Request** with detailed description.

**Development Environment Setup**: Follow the installation steps above.

---

## Testing and Quality Assurance

### Running Tests

**Server Tests**:
```bash
cd server
npm test
```

**Client Tests**:
```bash
cd client
npm run test
```

**Coverage Report**:
```bash
cd server
npm test -- --coverage
```

### Test Categories

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test complete user workflows

### Quality Standards

- **Code Coverage**: Minimum 80% target
- **Linting**: ESLint rules applied
- **Type Checking**: Type safety with TypeScript
- **Security Audit**: Dependency security check with npm audit

---

## Release Notes and History

### v1.0.0 (2026-04-02)
- First stable release
- Basic appointment management system
- Real-time notifications
- Security and performance optimizations

### v0.9.0 (2026-03-15)
- Beta release
- Completion of basic features
- Expansion of test coverage

### v0.1.0 (2026-01-01)
- Initial prototype
- Basic CRUD operations
- Simple user interface

**Release History Details**: Available in [CHANGELOG.md](CHANGELOG.md) file.

---

## License and Support

### License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

### Support and Contact

- **Developer**: Oğuz Selman Çetin
- **Email**: support@hairmanstudio.com
- **GitHub Issues**: [Report Issue](https://github.com/username/hairdresser-reservation/issues)
- **Documentation**: [Wiki](https://github.com/username/hairdresser-reservation/wiki)

### FAQ / Troubleshooting

**Q: Getting port conflict error?**
A: Clear ports using:
```bash
# Windows
FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :5000') DO taskkill /F /PID %P /T

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

**Q: Database connection error?**
A: Check `DATABASE_URL` in `.env` file. Default: `"file:./dev.db"`

**Q: JWT secret error?**
A: Set a strong secret for production:
```env
JWT_SECRET="long-and-strong-random-string"
```

**Q: Build error?**
A: Check your Node.js version (minimum 18.0):
```bash
node --version
npm --version
```

**Q: Tests failing?**
A: Use separate database for testing:
```bash
cd server
NODE_ENV=test npm test
```

---

*Developed by: Oğuz Selman Çetin | 2026*
