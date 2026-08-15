import { render, screen } from '@testing-library/react';
import MessagesPage from '../src/app/messages/page';

jest.mock('../src/lib/api', () => ({
  api: {
    messages: {
      getDirectChats: jest.fn().mockResolvedValue({
        success: true,
        data: {
          pending_requests: [],
          active_chats: [
            { id: 'c-1', partner_id: 'u-1', partner_name: 'Bob Stanford', partner_code: 'BOB123', partner_avatar: null },
          ],
        },
      }),
      getDirectMessages: jest.fn().mockResolvedValue({
        success: true,
        data: { messages: [] },
      }),
      sendChatRequest: jest.fn(),
      sendDirectMessage: jest.fn(),
    },
  },
}));

describe('Direct Messages Workspace (Jest + React Testing Library)', () => {
  test('renders messaging workspace with conversations list and chat request form', async () => {
    render(<MessagesPage />);

    expect(screen.getByText(/direct messages/i)).toBeInTheDocument();
    expect(screen.getByText(/conversations/i)).toBeInTheDocument();
    const matches = await screen.findAllByText(/Bob Stanford/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/code \(e\.g\. AB12CD\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request/i })).toBeInTheDocument();
  });
});
