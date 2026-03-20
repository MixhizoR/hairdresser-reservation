import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App Component - Booking Flow', () => {
  beforeEach(() => {
    // Clear localStorage and mock fetch with a default resolved value
    localStorage.clear();
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
    }));
    
    // Mock intersection observer for framer-motion
    window.IntersectionObserver = vi.fn().mockImplementation(function() {
        this.observe = () => null;
        this.unobserve = () => null;
        this.disconnect = () => null;
    });
  });

  it('stores deviceToken in localStorage on successful booking', async () => {
    // Mock specific endpoint responses
    global.fetch.mockImplementation((url) => {
        if (url.includes('/api/barbers')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 'barber-123', name: 'Test Barber' }])
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

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Wait for the barber to be loaded and the form to be visible
    await waitFor(() => {
        expect(screen.getByPlaceholderText('Örn: Alexander Noir')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('05xxxxxxxxx'), { target: { value: '05321234567' } });
    
    // Select date and slot
    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2027-10-10' } });
    
    // Click List Slots
    fireEvent.click(screen.getByText('Saatleri Listele'));
    
    // Select a slot
    const slot = await screen.findByText('10:00');
    fireEvent.click(slot);

    // Submit form
    fireEvent.submit(document.querySelector('form'));

    // Wait for API call to finish
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/appointments'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    // Check localStorage in a waitFor to ensure state updates have settled
    await waitFor(() => {
        const storedToken = localStorage.getItem('deviceToken');
        expect(storedToken).toBe('test-device-token-123');
    });
  });
});
