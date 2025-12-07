import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UpsellDialog, UpsellDialogProps } from './UpsellDialog';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const defaultProps: UpsellDialogProps = {
  open: true,
  onClose: vi.fn(),
  type: 'bot_creation',
  currentTier: 'FREE',
  currentLimits: {
    maxBots: 5,
    maxRunningBots: 1,
    displayName: 'Free'
  },
  currentUsage: {
    totalBots: 5,
    runningBots: 0
  },
  recommendedPlans: [
    {
      tier: 'BASIC',
      name: 'Basic',
      monthlyPrice: 9.99,
      priceCents: 999,
      currency: 'USD',
      headline: 'Unlock automation essentials',
      badge: 'Popular',
      features: ['Create up to 15 bots', 'Run 5 bots simultaneously'],
      limits: {
        maxBots: 15,
        maxRunningBots: 5,
        displayName: 'Basic'
      }
    },
    {
      tier: 'PREMIUM',
      name: 'Premium',
      monthlyPrice: 29.99,
      priceCents: 2999,
      currency: 'USD',
      headline: 'Advanced analytics',
      features: ['Create up to 50 bots', 'Run 25 bots simultaneously'],
      limits: {
        maxBots: 50,
        maxRunningBots: 25,
        displayName: 'Premium'
      }
    }
  ]
};

const renderWithRouter = (props: Partial<UpsellDialogProps> = {}) => {
  return render(
    <BrowserRouter>
      <UpsellDialog {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('UpsellDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bot Creation Limit', () => {
    it('renders bot creation limit message', () => {
      renderWithRouter({ type: 'bot_creation' });
      
      expect(screen.getByText('Bot Creation Limit Reached')).toBeInTheDocument();
    });

    it('displays current usage for bot creation', () => {
      renderWithRouter({ 
        type: 'bot_creation',
        currentUsage: { totalBots: 5, runningBots: 0 }
      });
      
      expect(screen.getByText(/5 \/ 5 bots created/i)).toBeInTheDocument();
    });

    it('shows current tier name', () => {
      renderWithRouter({ type: 'bot_creation' });
      
      expect(screen.getByText('FREE Plan')).toBeInTheDocument();
    });
  });

  describe('Running Bot Limit', () => {
    it('renders running bot limit message', () => {
      renderWithRouter({ 
        type: 'bot_running',
        currentUsage: { totalBots: 3, runningBots: 1 }
      });
      
      expect(screen.getByText('Running Bot Limit Reached')).toBeInTheDocument();
    });

    it('displays current usage for running bots', () => {
      renderWithRouter({ 
        type: 'bot_running',
        currentLimits: {
          maxBots: 5,
          maxRunningBots: 1,
          displayName: 'Free'
        },
        currentUsage: { totalBots: 3, runningBots: 1 }
      });
      
      expect(screen.getByText(/1 \/ 1 bots running/i)).toBeInTheDocument();
    });
  });

  describe('Recommended Plan', () => {
    it('shows recommended plan for upgrade', () => {
      renderWithRouter();
      
      expect(screen.getByText('Upgrade to Basic')).toBeInTheDocument();
    });

    it('displays recommended plan price', () => {
      renderWithRouter();
      
      expect(screen.getByText('$9.99')).toBeInTheDocument();
    });

    it('shows recommended plan features', () => {
      renderWithRouter();
      
      expect(screen.getByText('Create up to 15 bots')).toBeInTheDocument();
    });

    it('shows badge for recommended plan', () => {
      renderWithRouter();
      
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('shows limit chips for recommended plan', () => {
      renderWithRouter();
      
      expect(screen.getByText('15 bots')).toBeInTheDocument();
      expect(screen.getByText('5 running')).toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('calls onClose when "Maybe Later" clicked', () => {
      const onClose = vi.fn();
      renderWithRouter({ onClose });
      
      fireEvent.click(screen.getByText('Maybe Later'));
      
      expect(onClose).toHaveBeenCalled();
    });

    it('navigates to pricing page when upgrade button clicked', () => {
      const onClose = vi.fn();
      renderWithRouter({ onClose });
      
      fireEvent.click(screen.getByText('View Upgrade Options'));
      
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });
  });

  describe('Different Tiers', () => {
    it('recommends PREMIUM when current tier is BASIC', () => {
      renderWithRouter({
        currentTier: 'BASIC',
        currentLimits: {
          maxBots: 15,
          maxRunningBots: 5,
          displayName: 'Basic'
        },
        currentUsage: { totalBots: 15, runningBots: 0 }
      });
      
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });

    it('shows unlimited for ENTERPRISE tier features', () => {
      renderWithRouter({
        currentTier: 'PREMIUM',
        currentLimits: {
          maxBots: 50,
          maxRunningBots: 25,
          displayName: 'Premium'
        },
        currentUsage: { totalBots: 50, runningBots: 0 },
        recommendedPlans: [
          ...defaultProps.recommendedPlans!,
          {
            tier: 'ENTERPRISE',
            name: 'Enterprise',
            monthlyPrice: 199.99,
            priceCents: 19999,
            currency: 'USD',
            headline: 'Professional trading',
            features: ['Unlimited bots'],
            limits: {
              maxBots: -1,
              maxRunningBots: -1,
              displayName: 'Enterprise'
            }
          }
        ]
      });
      
      expect(screen.getByText('Upgrade to Enterprise')).toBeInTheDocument();
    });
  });

  describe('Dialog Visibility', () => {
    it('does not render when open is false', () => {
      renderWithRouter({ open: false });
      
      expect(screen.queryByText('Bot Creation Limit Reached')).not.toBeInTheDocument();
    });

    it('renders when open is true', () => {
      renderWithRouter({ open: true });
      
      expect(screen.getByText('Bot Creation Limit Reached')).toBeInTheDocument();
    });
  });

  describe('Info Alert', () => {
    it('shows tier-specific message in alert', () => {
      renderWithRouter({
        type: 'bot_creation',
        currentLimits: {
          maxBots: 5,
          maxRunningBots: 1,
          displayName: 'Free'
        }
      });
      
      expect(screen.getByText(/Free/)).toBeInTheDocument();
    });
  });
});
