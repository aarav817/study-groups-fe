import { render, screen, waitFor } from '@testing-library/react';
import AccountPage from '../src/app/account/page';

jest.mock('../src/lib/AuthContext', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Alex Morgan',
      email: 'alex@stanford.edu',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      bio: 'CS Undergrad',
      messaging_code: 'A183E1',
    },
    setUser: jest.fn(),
  }),
}));

jest.mock('../src/lib/api', () => ({
  api: {
    users: {
      getProfile: jest.fn().mockResolvedValue({
        success: true,
        data: {
          user: {
            full_name: 'Alex Morgan',
            email: 'alex@stanford.edu',
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
            bio: 'CS Undergrad',
            messaging_code: 'A183E1',
          },
        },
      }),
      updateProfile: jest.fn(),
    },
  },
}));

describe('Account Profile Editor (Jest + React Testing Library)', () => {
  test('renders user profile form fields with pre-filled values and messaging code', async () => {
    render(<AccountPage />);

    await waitFor(() => {
      expect(screen.getByText(/account profile/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/A183E1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Alex Morgan');
    expect(screen.getByLabelText(/^email/i)).toHaveValue('alex@stanford.edu');
    expect(screen.getByLabelText(/upload profile photo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio \/ study interests/i)).toHaveValue('CS Undergrad');
    expect(screen.getByRole('button', { name: /save profile changes/i })).toBeInTheDocument();
  });
});
