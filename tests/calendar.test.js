import { render, screen, waitFor } from '@testing-library/react';
import CalendarPage from '../src/app/calendar/page';

jest.mock('../src/lib/api', () => ({
  api: {
    events: {
      getMyEvents: jest.fn().mockResolvedValue({
        success: true,
        data: {
          events: [
            {
              id: 'event-1',
              title: 'NLP Exam Review',
              group_title: 'CS 224N',
              start_time: new Date().toISOString(),
              location: 'Green Library 204',
              attendee_count: 5,
              is_attending: false,
            },
          ],
        },
      }),
    },
    groups: {
      list: jest.fn().mockResolvedValue({
        success: true,
        data: { groups: [{ id: 'g-1', title: 'CS 224N' }] },
      }),
    },
  },
}));

describe('Study Calendar Page (Jest + React Testing Library)', () => {
  test('renders visual calendar header and schedule session button', async () => {
    render(<CalendarPage />);

    expect(screen.getByText(/study sessions calendar/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ schedule session/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});
