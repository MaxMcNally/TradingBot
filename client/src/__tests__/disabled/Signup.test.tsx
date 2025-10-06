import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Signup from './Signup';
import * as api from '../../api';

// Mock the API module
vi.mock('../../api', () => ({
  signup: vi.fn(),
}));

describe('Signup Component', () => {
  const mockSetUser = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form correctly', () => {
    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('submits signup form with correct data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    (api.signup as vi.Mock).mockResolvedValue({
      data: {
        data: {
          token: 'mock-token',
          user: mockUser
        }
      }
    });

    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.signup).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
        email: ''
      });
    });

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error message when signup fails', async () => {
    (api.signup as vi.Mock).mockRejectedValue(new Error('Email already exists'));

    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during signup', async () => {
    (api.signup as vi.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<Signup setUser={mockSetUser} onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });
});
