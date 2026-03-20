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
});
