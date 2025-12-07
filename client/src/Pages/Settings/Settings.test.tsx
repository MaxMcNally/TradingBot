import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Settings from './Settings';
import * as api from '../../api';
import { useSubscription } from '../../hooks';

// Mock the API module
vi.mock('../../api', () => ({
  getSettings: vi.fn(),
  saveSetting: vi.fn(),
  updateAccountSettings: vi.fn(),
  requestEmailVerification: vi.fn(),
  setup2FA: vi.fn(),
  enable2FA: vi.fn(),
  disable2FA: vi.fn(),
}));

// Mock the hooks
vi.mock('../../hooks', () => ({
  useSubscription: vi.fn(),
}));

// Mock AlpacaSettings component
vi.mock('./AlpacaSettings', () => ({
  default: function MockAlpacaSettings({ userId }: { userId: string }) {
    return <div data-testid="alpaca-settings">Alpaca Settings for {userId}</div>;
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    email_verified: false,
    two_factor_enabled: false,
  };

  const mockSubscription = {
    planTier: 'BASIC',
    planStatus: 'ACTIVE',
    provider: 'STRIPE',
    renewsAt: '2024-12-31',
    startedAt: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSubscription as vi.Mock).mockReturnValue({
      subscription: mockSubscription,
      history: [],
      isSubscriptionLoading: false,
      isMutating: false,
      cancelSubscription: vi.fn(),
    });
    (api.getSettings as vi.Mock).mockResolvedValue({ data: [] });
  });

  describe('Navigation Menu', () => {
    it('renders all navigation sections', () => {
      renderWithProviders(<Settings user={mockUser} />);

      // Check that all navigation items are present (use getAllByText since Account Settings appears twice)
      const accountSettingsTexts = screen.getAllByText('Account Settings');
      expect(accountSettingsTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Subscription')).toBeInTheDocument();
      expect(screen.getByText('Alpaca Trading Integration')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });

    it('shows Account Settings content by default', () => {
      renderWithProviders(<Settings user={mockUser} />);

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByText('Save Account Settings')).toBeInTheDocument();
    });

    it('switches to Subscription section when clicked', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      // Subscription appears in both nav and content, so use getAllByText
      const subscriptionTexts = screen.getAllByText('Subscription');
      expect(subscriptionTexts.length).toBeGreaterThan(0);
      // Check for specific subscription content
      expect(screen.getByText(/Basic Plan/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    });

    it('switches to Alpaca Trading Integration section when clicked', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const alpacaButton = screen.getByText('Alpaca Trading Integration');
      fireEvent.click(alpacaButton);

      expect(screen.getByTestId('alpaca-settings')).toBeInTheDocument();
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    });

    it('switches to Security section when clicked', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      // Check for the heading in the content area (not nav)
      const securityHeadings = screen.getAllByText('Security');
      expect(securityHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Email verification/i)).toBeInTheDocument();
      expect(screen.getByText(/Two-factor authentication/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    });

    it('highlights the active section in navigation', () => {
      renderWithProviders(<Settings user={mockUser} />);

      // Find the navigation button (not the heading) - Account Settings appears in nav
      const nav = document.querySelector('nav');
      const accountNavButton = nav?.querySelector('[role="button"]') as HTMLElement;
      expect(accountNavButton).toHaveClass('Mui-selected');

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      // After clicking, subscription button should be selected
      const allButtons = nav?.querySelectorAll('[role="button"]');
      const subscriptionNavButton = Array.from(allButtons || []).find(btn => 
        btn.textContent?.includes('Subscription')
      ) as HTMLElement;
      expect(subscriptionNavButton).toHaveClass('Mui-selected');
    });
  });

  describe('Account Settings Section', () => {
    it('displays account form fields with user data', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const nameField = screen.getByLabelText('Full Name') as HTMLInputElement;
      const emailField = screen.getByLabelText('Email') as HTMLInputElement;
      const usernameField = screen.getByLabelText('Username') as HTMLInputElement;

      expect(nameField.value).toBe('Test User');
      expect(emailField.value).toBe('test@example.com');
      expect(usernameField.value).toBe('testuser');
    });

    it('updates account settings when form fields change', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const nameField = screen.getByLabelText('Full Name');
      fireEvent.change(nameField, { target: { value: 'Updated Name' } });

      expect((nameField as HTMLInputElement).value).toBe('Updated Name');
    });

    it('saves account settings when save button is clicked', async () => {
      (api.updateAccountSettings as vi.Mock).mockResolvedValue({});

      renderWithProviders(<Settings user={mockUser} />);

      const saveButton = screen.getByText('Save Account Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(api.updateAccountSettings).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser',
        });
      });
    });

    it('displays success message after saving account settings', async () => {
      (api.updateAccountSettings as vi.Mock).mockResolvedValue({});

      renderWithProviders(<Settings user={mockUser} />);

      const saveButton = screen.getByText('Save Account Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Account settings updated successfully/i)).toBeInTheDocument();
      });
    });

    it('displays error message when save fails', async () => {
      (api.updateAccountSettings as vi.Mock).mockRejectedValue({
        response: { data: { error: 'Update failed' } },
      });

      renderWithProviders(<Settings user={mockUser} />);

      const saveButton = screen.getByText('Save Account Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Subscription Section', () => {
    it('displays subscription information', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      expect(screen.getByText(/Basic Plan/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: ACTIVE/i)).toBeInTheDocument();
    });

    it('shows loading state when subscription is loading', () => {
      (useSubscription as vi.Mock).mockReturnValue({
        subscription: null,
        history: [],
        isSubscriptionLoading: true,
        isMutating: false,
        cancelSubscription: vi.fn(),
      });

      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      // Check for Skeleton components by their class name
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('navigates to pricing page when Explore Plans is clicked', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      const explorePlansButton = screen.getByText('Explore Plans');
      fireEvent.click(explorePlansButton);

      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });

    it('shows cancel subscription button for paid plans', () => {
      (useSubscription as vi.Mock).mockReturnValue({
        subscription: { ...mockSubscription, planTier: 'PRO' },
        history: [],
        isSubscriptionLoading: false,
        isMutating: false,
        cancelSubscription: vi.fn(),
      });

      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
    });

    it('shows upgrade button for free plans', () => {
      (useSubscription as vi.Mock).mockReturnValue({
        subscription: { ...mockSubscription, planTier: 'FREE' },
        history: [],
        isSubscriptionLoading: false,
        isMutating: false,
        cancelSubscription: vi.fn(),
      });

      renderWithProviders(<Settings user={mockUser} />);

      const subscriptionButton = screen.getByText('Subscription');
      fireEvent.click(subscriptionButton);

      expect(screen.getByText('Upgrade to Basic')).toBeInTheDocument();
    });
  });

  describe('Security Section', () => {
    it('displays email verification status', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      expect(screen.getByText(/Status: Not verified/i)).toBeInTheDocument();
      expect(screen.getByText('Send verification')).toBeInTheDocument();
    });

    it('displays verified status when email is verified', () => {
      const verifiedUser = { ...mockUser, email_verified: true };
      renderWithProviders(<Settings user={verifiedUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      expect(screen.getByText(/Status: Verified/i)).toBeInTheDocument();
      expect(screen.queryByText('Send verification')).not.toBeInTheDocument();
    });

    it('sends verification email when button is clicked', async () => {
      (api.requestEmailVerification as vi.Mock).mockResolvedValue({});

      renderWithProviders(<Settings user={mockUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      const sendVerificationButton = screen.getByText('Send verification');
      fireEvent.click(sendVerificationButton);

      await waitFor(() => {
        expect(api.requestEmailVerification).toHaveBeenCalled();
      });
    });

    it('displays 2FA setup button when 2FA is not enabled', () => {
      renderWithProviders(<Settings user={mockUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      expect(screen.getByText('Set up 2FA')).toBeInTheDocument();
    });

    it('displays 2FA disable button when 2FA is enabled', () => {
      const userWith2FA = { ...mockUser, two_factor_enabled: true };
      renderWithProviders(<Settings user={userWith2FA} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      expect(screen.getByText('Disable 2FA')).toBeInTheDocument();
      expect(screen.queryByText('Set up 2FA')).not.toBeInTheDocument();
    });

    it('shows 2FA setup form when setup button is clicked', async () => {
      (api.setup2FA as vi.Mock).mockResolvedValue({
        data: {
          secret: 'TEST_SECRET',
          qrCodeDataUrl: 'data:image/png;base64,test',
        },
      });

      renderWithProviders(<Settings user={mockUser} />);

      const securityButton = screen.getByText('Security');
      fireEvent.click(securityButton);

      const setupButton = screen.getByText('Set up 2FA');
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Secret/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Enter 2FA Code/i)).toBeInTheDocument();
        expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('renders navigation and content side by side on desktop', () => {
      renderWithProviders(<Settings user={mockUser} />);

      // Check that navigation list is rendered
      const navList = document.querySelector('nav');
      expect(navList).toBeInTheDocument();
      
      // Check that content area exists (has the form fields)
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    });
  });
});

