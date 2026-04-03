import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ContactPage from '../pages/ContactPage';
import App from '../App';

describe('Contact Page Routing & Content', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            contactLocation: 'İstanbul, Türkiye',
            contactPhone: '+90 555 123 4567',
            contactEmail: 'info@hairman.com',
            salonDescription: 'Premium kuaför deneyimi.',
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
  });

  it('/contact route renders ContactPage', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: 'İletişim', level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('/iletisim redirects to /contact', async () => {
    render(
      <MemoryRouter initialEntries={['/iletisim']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: 'İletişim', level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('ContactPage shows contact info', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const addresses = screen.getAllByText('İstanbul, Türkiye');
      expect(addresses.length).toBeGreaterThan(0);
    });

    const phones = screen.getAllByText('+90 555 123 4567');
    expect(phones.length).toBeGreaterThan(0);

    const emails = screen.getAllByText('info@hairman.com');
    expect(emails.length).toBeGreaterThan(0);
  });

  it('ContactPage has a map placeholder (not working hours)', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const konumElements = screen.getAllByText('Konum');
      expect(konumElements.length).toBeGreaterThan(0);
    });

    const mapPlaceholder = screen.getAllByRole('img', { name: /harita yer tutucusu/i });
    expect(mapPlaceholder.length).toBeGreaterThan(0);

    const haritaElements = screen.getAllByText('Harita Burada Görüntülenecek');
    expect(haritaElements.length).toBeGreaterThan(0);

    const embedElements = screen.getAllByText('Google Maps veya OpenStreetMap embed');
    expect(embedElements.length).toBeGreaterThan(0);

    expect(screen.queryByText(/çalışma saatleri/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/working hours/i)).not.toBeInTheDocument();
  });

  it('contact page access is intact after FAB removal', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: 'İletişim', level: 1 });
      expect(headings.length).toBeGreaterThan(0);
    });

    // FAB elements should be removed
    expect(screen.queryByRole('link', { name: /saatinizi değiştirmeniz mi gerekiyor/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /bize ulaşın/i })).not.toBeInTheDocument();
  });
});
