import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './Settings';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getSettings: jest.fn(),
  saveSetting: jest.fn(),
}));

describe('Settings Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings form correctly', () => {
    render(<Settings user={mockUser} />);
    
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('loads user settings on component mount', async () => {
    const mockSettings = [
      { setting_key: 'theme', setting_value: 'dark' },
      { setting_key: 'notifications', setting_value: 'true' }
    ];

    (api.getSettings as jest.Mock).mockResolvedValue({
      data: mockSettings
    });

    render(<Settings user={mockUser} />);

    await waitFor(() => {
      expect(api.getSettings).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('saves settings when form is submitted', async () => {
    (api.getSettings as jest.Mock).mockResolvedValue({
      data: []
    });

    (api.saveSetting as jest.Mock).mockResolvedValue({
      data: { success: true }
    });

    render(<Settings user={mockUser} />);

    await waitFor(() => {
      expect(api.getSettings).toHaveBeenCalled();
    });

    const keyInput = screen.getByLabelText('Key');
    const valueInput = screen.getByLabelText('Value');
    const saveButton = screen.getByText('Save');

    fireEvent.change(keyInput, { target: { value: 'theme' } });
    fireEvent.change(valueInput, { target: { value: 'dark' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveSetting).toHaveBeenCalledWith({
        user_id: mockUser.id,
        setting_key: 'theme',
        setting_value: 'dark'
      });
    });
  });

  it('displays saved settings', async () => {
    const mockSettings = [
      { setting_key: 'theme', setting_value: 'dark' }
    ];

    (api.getSettings as jest.Mock).mockResolvedValue({
      data: mockSettings
    });

    render(<Settings user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('theme: dark')).toBeInTheDocument();
    });
  });
});
