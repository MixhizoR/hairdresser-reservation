import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrackPage from '../pages/TrackPage';
import AppointmentsPage from '../pages/admin/AppointmentsPage';
import BarberPanel from '../pages/barber/BarberPanel';

describe('Absence of completed/cancelled status', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('noir_token', 'test-token');
    localStorage.setItem('noir_user_role', 'BARBER');

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/appointments/track')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 'appt-1',
            trackingCode: 'TEST01',
            status: 'approved',
            service: 'Saç Kesimi',
            time: new Date().toISOString(),
            name: 'Test User',
            barberName: 'Test Berber',
          }])
        });
      }
      if (url.includes('/api/appointments') && !url.includes('track')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: '1', status: 'pending', name: 'Ali', phone: '05551112233', service: 'Kesim', time: new Date().toISOString(), barber: { name: 'Berber 1' } },
            { id: '2', status: 'approved', name: 'Veli', phone: '05552223344', service: 'Sakal', time: new Date().toISOString(), barber: { name: 'Berber 1' } },
            { id: '3', status: 'rejected', name: 'Ayşe', phone: '05553334455', service: 'Boya', time: new Date().toISOString(), barber: { name: 'Berber 2' } },
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
      if (url.includes('/api/sounds')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ files: [] })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    window.IntersectionObserver = vi.fn().mockImplementation(function () {
      this.observe = () => null;
      this.unobserve = () => null;
      this.disconnect = () => null;
    });
  });

  describe('TrackPage', () => {
    it('does NOT contain "completed" or "Tamamlandı" in the timeline', async () => {
      render(
        <MemoryRouter initialEntries={['/track?code=TEST01']}>
          <TrackPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TEST01')).toBeInTheDocument();
      });

      const allText = document.body.textContent;
      expect(allText.toLowerCase()).not.toContain('completed');
      expect(allText).not.toContain('Tamamlandı');
      expect(allText).not.toContain('tamamlandı');
    });

    it('timeline only has pending and approved states', async () => {
      render(
        <MemoryRouter initialEntries={['/track?code=TEST01']}>
          <TrackPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TEST01')).toBeInTheDocument();
      });

      const bekliyorElements = screen.getAllByText('Bekliyor');
      expect(bekliyorElements.length).toBeGreaterThan(0);

      const onaylandiElements = screen.getAllByText('Onaylandı');
      expect(onaylandiElements.length).toBeGreaterThan(0);

      expect(screen.queryByText('Reddedildi')).not.toBeInTheDocument();
      expect(screen.queryByText('Tamamlandı')).not.toBeInTheDocument();
      expect(screen.queryByText('İptal Edildi')).not.toBeInTheDocument();
    });

    it('shows guidance section at the expected position', async () => {
      render(
        <MemoryRouter initialEntries={['/track']}>
          <TrackPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const elements = screen.getAllByText('Nasıl Çalışır?');
        expect(elements.length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('Takip Kodunuzu Alın').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Kodu Girin').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Durumunuzu Görün').length).toBeGreaterThan(0);
    });

    it('has "Bize Ulaşın" sidebar button linking to /contact', async () => {
      render(
        <MemoryRouter initialEntries={['/track']}>
          <TrackPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const contactLinks = screen.getAllByText('Bize Ulaşın');
        expect(contactLinks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AppointmentsPage', () => {
    const defaultProps = {
      token: 'test-token',
      authHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test-token' }),
      audioEnabled: false,
      playSynth: vi.fn(),
    };

    it('filter does NOT include "completed" or "cancelled" options', async () => {
      render(
        <MemoryRouter>
          <AppointmentsPage {...defaultProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Tümü')).toBeInTheDocument();
      });

      expect(screen.getByText('Bekleyen')).toBeInTheDocument();
      expect(screen.getByText('Onaylanan')).toBeInTheDocument();
      expect(screen.getByText('Reddedilen')).toBeInTheDocument();

      expect(screen.queryByText('Tamamlandı')).not.toBeInTheDocument();
      expect(screen.queryByText('İptal Edildi')).not.toBeInTheDocument();
      expect(screen.queryByText('completed', { exact: false })).not.toBeInTheDocument();
      expect(screen.queryByText('cancelled', { exact: false })).not.toBeInTheDocument();
    });
  });

  describe('BarberPanel', () => {
    const defaultProps = {
      token: 'test-token',
      currentUser: { name: 'Test Barber', username: 'testbarber' },
      authHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test-token' }),
      onLogout: vi.fn(),
      audioEnabled: false,
      toggleAudio: vi.fn(),
      playSynth: vi.fn(),
    };

    it('does NOT have a "Tamamlandı Olarak İşaretle" button', async () => {
      render(
        <MemoryRouter>
          <BarberPanel {...defaultProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Barber')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const completedButton = allButtons.find(btn =>
        btn.textContent.includes('Tamamlandı') ||
        btn.textContent.includes('tamamlandı') ||
        btn.textContent.includes('completed') ||
        btn.textContent.includes('Complete')
      );
      expect(completedButton).toBeUndefined();
    });

    it('only shows approve and reject actions for pending appointments', async () => {
      render(
        <MemoryRouter>
          <BarberPanel {...defaultProps} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Onay Bekleyen')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Onayla');
      expect(approveButtons.length).toBeGreaterThan(0);

      const rejectButtons = screen.getAllByText('Reddet');
      expect(rejectButtons.length).toBeGreaterThan(0);

      expect(screen.queryByText('Tamamlandı Olarak İşaretle')).not.toBeInTheDocument();
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    });
  });
});
