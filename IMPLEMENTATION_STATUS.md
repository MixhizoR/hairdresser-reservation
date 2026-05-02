You are a meticulous Senior React developer. Your task is to execute the following "Implementation Plan" exactly as written.

# Implementation Plan: Fix Booking Flow Test Crashes

The tests are crashing on initial mount because a mocked fetch response is returning an object instead of an expected array, causing a React error boundary crash (blank screen). We need to revert the mock and fix corrupted text assertions.

## 🎯 Success Criteria
- [ ] `App.test.jsx` and `bookingFlow.test.jsx` pass successfully.

---

## 📂 Strict File Tree & Paths
*   `client/src/App.test.jsx`
*   `client/src/tests/bookingFlow.test.jsx`

---

## 🛠️ Phase 1: Revert Bad Mocks Causing React Crashes

### Step 1.1: Fix Availability Mock in App.test.jsx
**File:** `client/src/App.test.jsx`
- **How:** The API expects an array of taken slots, not an object. We must revert the mock.
- **Do That:**
  - Locate the `if (url.includes('/api/appointments/availability'))` block.
  - Change the `json` property inside it to return an empty array EXACTLY like this: `json: () => Promise.resolve([])`

### Step 1.2: Fix Availability Mock in bookingFlow.test.jsx
**File:** `client/src/tests/bookingFlow.test.jsx`
- **How:** The API expects an array of taken slots, not an object. We must revert the mock.
- **Do That:**
  - Locate the `if (url.includes('/api/appointments/availability'))` block.
  - Change the `json` property inside it to return an empty array EXACTLY like this: `json: () => Promise.resolve([])`

---

## 🛠️ Phase 2: Fix Test Assertions

### Step 2.1: Fix Corrupted Text in App.test.jsx
**File:** `client/src/App.test.jsx`
- **How:** The previous edits corrupted Turkish text assertions. We need to restore them.
- **Do That:**
  - Find any instance of `'Tarih ve Saat Se??in'` and replace it exactly with `'Tarih ve Saat Seçin'`
  - Find any instance of `'Ki??isel Bilgileriniz'` and replace it exactly with `'Kişisel Bilgileriniz'`
  - Find any instance of `??stanbul` and replace it with `İstanbul`

### Step 2.2: Fix Corrupted Text in bookingFlow.test.jsx
**File:** `client/src/tests/bookingFlow.test.jsx`
- **How:** Ensure text queries match the UI exactly.
- **Do That:**
  - Find any instance of `'Tarih ve Saat Se??in'` and replace it exactly with `'Tarih ve Saat Seçin'`
  - Find any instance of `'Ki??isel Bilgileriniz'` and replace it exactly with `'Kişisel Bilgileriniz'`
  - Find any instance of `??stanbul` and replace it with `İstanbul`

---

## 🚫 Forbidden Actions (Guardrails)
*   **Do NOT** alter the step-by-step logic inside the `describe` blocks. Only update the exact strings and the mocked fetch responses.
*   **Do NOT** write any new test cases.

---

## ✅ Verification Command
Run the following command from the project root:
```bash
cd client && npm run test App.test.jsx bookingFlow.test.jsx