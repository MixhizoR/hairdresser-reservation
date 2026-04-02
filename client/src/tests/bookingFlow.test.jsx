import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Booking Flow - Tracking Code & Redirect', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Saç Kesimi', price: 250, duration: 45, category: 'BARBERING' }
          ])
        });
      }
      if (url.includes('/api/barbers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: 'Test Berber', level: 'MASTER' }
          ])
        });
      }
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            operatingHours: {
              monday: { open: '09:00', close: '18:00' },
              tuesday: { open: '09:00', close: '18:00' },
              wednesday: { open: '09:00', close: '18:00' },
              thursday: { open: '09:00', close: '18:00' },
              friday: { open: '09:00', close: '18:00' },
              saturday: { open: '09:00', close: '18:00' },
              sunday: { closed: true },
            }
          })
        });
      }
      if (url.includes('/api/appointments/availability')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/appointments') && !url.includes('availability') && !url.includes('track')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'appt-xxx-123',
            trackingCode: 'ABC123',
            status: 'pending'
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    window.IntersectionObserver = vi.fn().mockImplementation(function () {
      this.observe = () => null;
      this.unobserve = () => null;
      this.disconnect = () => null;
    });

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  const completeBooking = async () => {
    render(
      <MemoryRouter initialEntries={['/book']}>
        <App />
      </MemoryRouter>
    );

    // Step 1: Select service - last match is in step content
    await waitFor(() => {
      expect(screen.getAllByText('Hizmet Seçin').length).toBeGreaterThan(0);
    });
    const serviceElements = screen.getAllByText('Saç Kesimi');
    fireEvent.click(serviceElements[serviceElements.length - 1]);

    // Step 2: Select barber - use last match (in step content, not summary)
    await waitFor(() => {
      expect(screen.getAllByText('Stilistinizi Seçin').length).toBeGreaterThan(0);
    });
    const barberElements = screen.getAllByText('Test Berber');
    fireEvent.click(barberElements[barberElements.length - 1]);

    // Step 3: Date & time
    await waitFor(() => {
      expect(screen.getAllByText('Tarih ve Saat Seçin').length).toBeGreaterThan(0);
    });

    const today = new Date().getDate();
    const dayElements = screen.getAllByText(today.toString());
    const dayButton = dayElements.find(el => el.classList.contains('cal-day'));
    fireEvent.click(dayButton);

    await waitFor(() => {
      const slots = screen.getAllByText(/^\d{2}:\d{2}$/);
      expect(slots.length).toBeGreaterThan(0);
    });

    const timeSlots = screen.getAllByText(/^\d{2}:\d{2}$/);
    const availableSlot = timeSlots.find(el => !el.classList.contains('taken') && el.closest('button') && !el.closest('button').disabled);
    fireEvent.click(availableSlot || timeSlots[0]);

    fireEvent.click(screen.getAllByText('Devam →')[0]);

    // Step 4: Fill details
    await waitFor(() => {
      expect(screen.getAllByText('Bilgileriniz').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText('Ahmet Yılmaz'), { target: { value: 'Test Kullanıcı' } });
    fireEvent.change(screen.getByPlaceholderText('05xxxxxxxxx'), { target: { value: '05321234567' } });

    fireEvent.click(screen.getAllByText('Randevuyu Onayla')[0]);
  };

  it('shows success screen with tracking code after booking', async () => {
    await completeBooking();

    await waitFor(() => {
      expect(screen.getAllByText('Randevu Talebi Gönderildi!').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getAllByText('ABC123').length).toBeGreaterThan(0);
    });
  });

  it('has a copy-to-clipboard button next to the tracking code', async () => {
    await completeBooking();

    await waitFor(() => {
      expect(screen.getAllByText('ABC123').length).toBeGreaterThan(0);
    });

    const copyButtons = screen.getAllByRole('button', { name: /takip kodunu kopyala/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });

  it('navigates to /track?code=ABC123 when clicking Randevuyu Takip Et', async () => {
    await completeBooking();

    await waitFor(() => {
      const headings = screen.getAllByText('Randevu Talebi Gönderildi!');
      expect(headings.length).toBeGreaterThan(0);
    });

    const trackButtons = screen.getAllByText('Randevuyu Takip Et');
    expect(trackButtons.length).toBeGreaterThan(0);

    fireEvent.click(trackButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/track?code=ABC123');
  });
});
