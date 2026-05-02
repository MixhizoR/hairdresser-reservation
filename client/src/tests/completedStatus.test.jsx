import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import TrackPage from "../pages/TrackPage";
import AppointmentsPage from "../pages/admin/AppointmentsPage";
import BarberPanel from "../pages/barber/BarberPanel";

// Mock fetch globally
global.fetch = vi.fn();

const defaultProps = {
  token: "test-token",
  currentUser: { role: "ADMIN", id: "admin-1", username: "admin" },
  authHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
  }),
};

describe("Absence of completed/cancelled status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TrackPage", () => {
    it('does NOT contain "completed" or "Tamamlandı" in the timeline', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "1",
              status: "approved",
              time: new Date().toISOString(),
              name: "John",
              service: "Cut",
              barber: { name: "Ali" },
              createdAt: new Date().toISOString(),
            },
          ]),
      });

      render(
        <MemoryRouter initialEntries={["/track?code=ABC123"]}>
          <TrackPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Tamamlandı/i)).not.toBeInTheDocument();
      });
    });

    it("timeline only has pending and approved states", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "1",
              status: "approved",
              time: new Date().toISOString(),
              name: "John",
              service: "Cut",
              barber: { name: "Ali" },
              createdAt: new Date().toISOString(),
            },
          ]),
      });

      render(
        <MemoryRouter initialEntries={["/track?code=ABC123"]}>
          <TrackPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        // Timeline should show approved status
        expect(screen.getAllByText(/Randevunuz Onaylandı/i).length).toBeGreaterThan(0);
        // Should NOT show any cancelled/completed indicators
        expect(screen.queryByText(/İptal Edildi/i)).not.toBeInTheDocument();
      });
    });

    it("shows guidance section at the expected position", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(
        <MemoryRouter>
          <TrackPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const els = screen.queryAllByText(/Takip Kodunuzu Alın/i);
        expect(els.length || screen.queryAllByText(/Kodu Girin/i).length).toBeGreaterThan(0);
      });
    });

    it('has "Bize Ulaşın" sidebar button linking to /contact', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(
        <MemoryRouter>
          <TrackPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const contactLinks = screen.getAllByText(/Bize Ulaşın/i);
        expect(contactLinks.at(-1).closest("a")).toHaveAttribute("href", "/contact");
      });
    });
  });

  describe("AppointmentsPage", () => {
    it('filter does NOT include "completed" or "cancelled" options', async () => {
      // Mock appointments list
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(
        <MemoryRouter>
          <AppointmentsPage {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const filterSelects = screen.queryAllByRole("combobox");
        if (filterSelects.length > 0) {
          const filterSelect = filterSelects.find(s => s.options && s.options.length > 0) || filterSelects[0];
          const options = Array.from(filterSelect.options).map((o) => o.value);
          expect(options).not.toContain("completed");
          expect(options).not.toContain("cancelled");
        }
      });
    });

    it("opens BreakModal when Mola Ekle button is clicked", async () => {
      // Mock barbers list
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: "barber-1", name: "Barber One" }]),
      });

      render(
        <MemoryRouter>
          <AppointmentsPage {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { name: "Randevular" });
        expect(headings.length).toBeGreaterThan(0);
      });

      const molaButtons = screen.getAllByText("Mola Ekle");
      fireEvent.click(molaButtons.at(-1));

      // Assert BreakModal appears
      await waitFor(() => {
        const modals = screen.getAllByText("Mola / İzin Ekle");
        expect(modals.length).toBeGreaterThan(0);
      });

      // fill form
      fireEvent.change(screen.getAllByLabelText("Tarih").at(-1), {
        target: { value: "2026-05-10" },
      });
      fireEvent.change(screen.getAllByLabelText("Başlangıç Saati").at(-1), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getAllByLabelText("Bitiş Saati").at(-1), {
        target: { value: "12" },
      });
      fireEvent.change(screen.getAllByLabelText("Berber Seçin").at(-1), {
        target: { value: "barber-1" },
      });

      const submitBtn = screen.getAllByText("Saatleri Kapat").at(-1);
      fireEvent.click(submitBtn);

      // Assert fetch called with correct payload
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/appointments"),
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"customDuration":120'),
          }),
        );
      });
    });

    it("shows error when TIME_SLOT_TAKEN occurs", async () => {
      // Mock fetch to return error on POST
      const mockFetch = vi.fn().mockImplementation((url, options) => {
        if (url.includes("/api/appointments") && options?.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: "TIME_SLOT_TAKEN" }),
          });
        }
        if (url.includes("/api/barbers")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([{ id: "barber-1", name: "Barber One" }]),
          });
        }
        if (url.includes("/api/appointments") && !url.includes("track")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });
      global.fetch = mockFetch;

      render(
        <MemoryRouter>
          <AppointmentsPage {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { name: "Randevular" });
        expect(headings.length).toBeGreaterThan(0);
      });

      const molaButtons = screen.getAllByText("Mola Ekle");
      fireEvent.click(molaButtons.at(-1));

      await waitFor(() => {
        expect(
          screen.getAllByRole("heading", { name: "Mola / İzin Ekle" }).at(-1),
        ).toBeInTheDocument();
      });

      // fill form
      fireEvent.change(screen.getAllByLabelText("Tarih").at(-1), {
        target: { value: "2026-05-10" },
      });
      fireEvent.change(screen.getAllByLabelText("Başlangıç Saati").at(-1), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getAllByLabelText("Bitiş Saati").at(-1), {
        target: { value: "12" },
      });
      fireEvent.change(screen.getAllByLabelText("Berber Seçin").at(-1), {
        target: { value: "barber-1" },
      });

      const submitButtons = screen.getAllByText("Saatleri Kapat");
      fireEvent.click(submitButtons.at(-1));

      await waitFor(() => {
        expect(screen.getAllByText(/çakışma mevcut/).at(-1)).toBeInTheDocument();
      });
    });

    it("shows error when endTime is before or equal to startTime", async () => {
      // Mock barbers endpoint
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes("/api/barbers")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([{ id: "barber-1", name: "Barber One" }]),
          });
        }
        if (url.includes("/api/appointments")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      render(
        <MemoryRouter>
          <AppointmentsPage {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { name: "Randevular" });
        expect(headings.length).toBeGreaterThan(0);
      });

      const molaButtons = screen.getAllByText("Mola Ekle");
      fireEvent.click(molaButtons.at(-1));

      await waitFor(() => {
        expect(screen.getAllByText(/Mola/i).length).toBeGreaterThan(0);
      });

      // Use ARIA labels for selects
      const dateInput = screen.getAllByLabelText("Tarih").at(-1);
      const startH = screen.getAllByLabelText("Başlangıç Saati").at(-1);
      const endH = screen.getAllByLabelText("Bitiş Saati").at(-1);

      fireEvent.change(dateInput, { target: { value: "2026-05-11" } }); // Monday

      // Set start time 14:00, end time 13:00 (invalid)
      fireEvent.change(startH, { target: { value: "14" } });
      fireEvent.change(endH, { target: { value: "13" } });

      const barberSelects = screen.getAllByLabelText(/Berber Seçin/i);
      fireEvent.change(barberSelects.at(-1), { target: { value: "barber-1" } });

      const submitBtns = screen.getAllByText("Saatleri Kapat");
      fireEvent.click(submitBtns.at(-1));

      // Assert the exact string from your handleSubmit component
      await waitFor(() => {
        expect(
          screen.getAllByText("Bitiş saati başlangıç saatinden sonra olmalıdır.").at(-1),
        ).toBeInTheDocument();
      });
    });
  });

  describe("BarberPanel", () => {
    const defaultProps = {
      token: "test-token",
      currentUser: { name: "Test Barber", username: "testbarber" },
      authHeaders: () => ({
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      }),
      onLogout: vi.fn(),
    };

    it('does NOT have a "Tamamlandı Olarak İşaretle" button', async () => {
      render(
        <MemoryRouter>
          <BarberPanel {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getAllByText("Test Barber").length).toBeGreaterThan(0);
      });

      const allButtons = screen.getAllByRole("button");
      const completedButton = allButtons.find(
        (b) => b.textContent === "Tamamlandı Olarak İşaretle",
      );
      expect(completedButton).toBeUndefined();
    });

    it("only shows approve and reject actions for pending appointments", async () => {
      // Mock appointments list with one pending
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "1",
              status: "pending",
              time: new Date().toISOString(),
              name: "John",
              service: "Cut",
              barberId: "barber-1",
            },
          ]),
      });

      render(
        <MemoryRouter>
          <BarberPanel {...defaultProps} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getAllByText("Onayla").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Reddet").length).toBeGreaterThan(0);
      });
    });
  });
});
