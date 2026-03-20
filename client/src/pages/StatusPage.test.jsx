import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StatusPage from './StatusPage';

describe('StatusPage Component', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));
    });

    it('shows loading state and fetches by deviceToken on mount', async () => {
        localStorage.setItem('deviceToken', 'test-device-token-123');

        render(
            <BrowserRouter>
                <StatusPage />
            </BrowserRouter>
        );

        // Should display a loading indicator initially
        expect(screen.getByText(/Yükleniyor/i)).toBeInTheDocument();

        // Should call fetch with the device token
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/appointments/track?deviceToken=test-device-token-123')
            );
        });
    });

    it('renders appointment details when data is fetched', async () => {
        const mockAppt = {
            id: 'appt-123',
            service: 'Saç Kesimi',
            name: 'J*** D***',
            status: 'approved',
            time: new Date().toISOString(),
            barberName: 'Barber Bob'
        };

        global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockAppt])
        }));

        localStorage.setItem('deviceToken', 'test-device-token-123');

        render(
            <BrowserRouter>
                <StatusPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Saç Kesimi')).toBeInTheDocument();
            expect(screen.getByText('J*** D***')).toBeInTheDocument();
            expect(screen.getByText('ONAYLANDI')).toBeInTheDocument();
            expect(screen.getByText('Barber Bob')).toBeInTheDocument();
        });
    });
});
