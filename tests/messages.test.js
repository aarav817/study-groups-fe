import { render, screen } from '@testing-library/react';
import MessagesPage from '../src/app/messages/page';

jest.mock('../src/lib/api', () => ({
  api: {
    messages: {
      getChatRequests: jest.fn().mockResolvedValue({
        success: true,
        data: { requests: [] },
      }),
      getContacts: jest.fn().mockResolvedValue({
        success: true,
        data: {
          contacts: [
            { id: 'u-1', full_name: 'Bob Stanford', messaging_code: 'BOB123', avatar_url: null },
          ],
        },
      }),
      getDirectMessages: jest.fn().mockResolvedValue({
        success: true,
        data: { messages: [] },
      }),
    },
  },
}));

describe('Direct Messages Workspace (Jest + React Testing Library)', () => {
  test('renders messaging workspace with contacts list and chat request form', async () => {
    render(<MessagesPage />);

    expect(screen.getByText(/direct messages workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/my contacts/i)).toBeInTheDocument();
    expect(await screen.findByText(/Bob Stanford/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/6-character messaging code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /📩 request chat/i })).toBeInTheDocument();
  });
});
