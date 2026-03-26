import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App Component - Booking Flow', () => {
  beforeEach(() => {
    // Clear localStorage and mock fetch with a default resolved value
    localStorage.clear();
    global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/services')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 1, name: 'Classic Cut', price: 250, duration: 45, category: 'BARBERING' }
                ])
            });
        }
        if (url.includes('/api/barbers')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 1, name: 'Test Barber', level: 'MASTER' }
                ])
            });
        }
        if (url.includes('/api/appointments/availability')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['10:30']) // 10:30 is taken
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
    
    // Mock intersection observer for framer-motion
    window.IntersectionObserver = vi.fn().mockImplementation(function() {
        this.observe = () => null;
        this.unobserve = () => null;
        this.disconnect = () => null;
    });
  });

  it('stores deviceToken in localStorage on successful booking', async () => {
    render(
      <MemoryRouter initialEntries={['/book']}>
        <App />
      </MemoryRouter>
    );

    // Step 1: Choose Service
    await waitFor(() => {
        expect(screen.getByText('Choose a Service')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Classic Cut'));

    // Step 2: Choose Stylist
    await waitFor(() => {
        expect(screen.getByText('Choose Your Stylist')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test Barber'));

    // Step 3: Pick a Date
    await waitFor(() => {
        expect(screen.getByText('Pick a Date')).toBeInTheDocument();
    });
    
    // Find a day in the calendar (e.g., today's date)
    const today = new Date().getDate();
    const dayElements = screen.getAllByText(today.toString());
    const dayButton = dayElements.find(el => el.classList.contains('cal-day'));
    fireEvent.click(dayButton);

    // Select a time (10:00 is available, 10:30 is mocked as taken)
    await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('10:00'));

    // Click Continue
    fireEvent.click(screen.getByText('Continue →'));

    // Step 4: Details
    await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('+90 555 123 4567'), { target: { value: '05321234567' } });

    // Submit form
    fireEvent.click(screen.getByText('Confirm Booking ✓'));

    // Wait for API call to finish
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/appointments'),
            expect.objectContaining({ 
                method: 'POST',
                body: expect.stringContaining('"name":"Test User"') 
            })
        );
    });

    // Check localStorage in a waitFor to ensure state updates have settled
    await waitFor(() => {
        const storedToken = localStorage.getItem('deviceToken');
        expect(storedToken).toBe('test-device-token-123');
    }, { timeout: 2000 });
  });
});
