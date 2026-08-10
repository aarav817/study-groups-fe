import { render, screen } from '@testing-library/react';
import LoginPage from '../src/app/login/page';
import SignupPage from '../src/app/signup/page';

// Mock Next.js router & layout hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../src/lib/AuthContext', () => ({
  useAuth: () => ({
    setUser: jest.fn(),
  }),
}));

describe('Frontend Auth Components (Jest + React Testing Library)', () => {
  test('renders Sign In page form inputs and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/university email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders Create Account page form inputs and submit button', () => {
    render(<SignupPage />);

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/university email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
