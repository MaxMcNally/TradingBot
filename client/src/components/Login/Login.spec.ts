import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  login: jest.fn(),
}));

describe('Login Component', () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login setUser={mockSetUser} />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<Login setUser={mockSetUser} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('submits login form with correct data', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    };

    (api.login as jest.Mock).mockResolvedValue({
      data: {
        data: {
          token: 'mock-token',
          user: mockUser
        }
      }
    });

    render(<Login setUser={mockSetUser} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error message when login fails', async () => {
    (api.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(<Login setUser={mockSetUser} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    (api.login as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<Login setUser={mockSetUser} />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<Login setUser={mockSetUser} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Should not call API with empty fields
    expect(api.login).not.toHaveBeenCalled();
  });
});
