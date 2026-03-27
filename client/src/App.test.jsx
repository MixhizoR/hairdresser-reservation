import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App Component - Booking Flow', () => {
  beforeEach(() => {
    localStorage.clear();
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
        if (url.includes('/api/appointments/availability')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['10:30'])
            });
        }
        if (url.includes('/api/appointments') && !url.includes('availability')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    id: 'appt-123',
                    deviceToken: 'test-device-token-123',
                    trackingCode: 'TRACK1'
                })
            });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    window.IntersectionObserver = vi.fn().mockImplementation(function() {
        this.observe = () => null;
        this.unobserve = () => null;
        this.disconnect = () => null;
    });
  });

  it('shows success screen with tracking code after booking', async () => {
    render(
      <MemoryRouter initialEntries={['/book']}>
        <App />
      </MemoryRouter>
    );

    // Step 1: Choose Service
    await waitFor(() => {
        expect(screen.getByText('Hizmet Seçin')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Saç Kesimi'));

    // Step 2: Choose Stylist
    await waitFor(() => {
        expect(screen.getByText('Stilistinizi Seçin')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Berber'));

    // Step 3: Pick a Date
    await waitFor(() => {
        expect(screen.getByText('Tarih ve Saat Seçin')).toBeInTheDocument();
    });

    const today = new Date().getDate();
    const dayElements = screen.getAllByText(today.toString());
    const dayButton = dayElements.find(el => el.classList.contains('cal-day'));
    fireEvent.click(dayButton);

    await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('10:00'));

    fireEvent.click(screen.getByText('Devam →'));

    // Step 4: Details
    await waitFor(() => {
        expect(screen.getByText('Bilgileriniz')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ahmet Yılmaz'), { target: { value: 'Test Kullanıcı' } });
    fireEvent.change(screen.getByPlaceholderText('05xxxxxxxxx'), { target: { value: '05321234567' } });

    fireEvent.click(screen.getByText('Randevuyu Onayla'));

    // Verify success screen appears
    await waitFor(() => {
        expect(screen.getByText('Randevu Talebi Gönderildi!')).toBeInTheDocument();
    });

    // Verify tracking code is displayed
    await waitFor(() => {
        expect(screen.getByText('TRACK1')).toBeInTheDocument();
    });
  });
});
