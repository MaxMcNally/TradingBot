import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumFeatureGate, LeaderboardGate, MarketplaceGate } from './PremiumFeatureGate';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('PremiumFeatureGate', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should not render gate when user has access', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="BASIC"
        requiredTier="BASIC"
      />
    );

    expect(screen.queryByText('Test Feature')).not.toBeInTheDocument();
  });

  it('should not render gate when user has higher tier', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="PREMIUM"
        requiredTier="BASIC"
      />
    );

    expect(screen.queryByText('Test Feature')).not.toBeInTheDocument();
  });

  it('should render gate when user is on FREE tier and requires BASIC', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="BASIC"
      />
    );

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should display current tier in alert', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="BASIC"
      />
    );

    expect(screen.getByText(/You're currently on the/)).toBeInTheDocument();
    expect(screen.getByText(/FREE/)).toBeInTheDocument();
  });

  it('should display benefits when provided', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="BASIC"
        benefits={['Benefit 1', 'Benefit 2', 'Benefit 3']}
      />
    );

    expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    expect(screen.getByText('Benefit 2')).toBeInTheDocument();
    expect(screen.getByText('Benefit 3')).toBeInTheDocument();
  });

  it('should navigate to pricing page when upgrade button is clicked', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="BASIC"
        ctaText="Upgrade Now"
      />
    );

    const upgradeButton = screen.getByRole('button', { name: /Upgrade Now/i });
    fireEvent.click(upgradeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/pricing');
  });

  it('should display custom CTA text', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="BASIC"
        ctaText="Custom Upgrade Button"
      />
    );

    expect(screen.getByRole('button', { name: /Custom Upgrade Button/i })).toBeInTheDocument();
  });

  it('should display required tier chip', () => {
    renderWithProviders(
      <PremiumFeatureGate
        featureName="Test Feature"
        featureDescription="Test description"
        currentTier="FREE"
        requiredTier="PREMIUM"
      />
    );

    expect(screen.getByText(/Requires PREMIUM plan or higher/)).toBeInTheDocument();
  });
});

describe('LeaderboardGate', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render for FREE users', () => {
    renderWithProviders(<LeaderboardGate currentTier="FREE" />);

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText(/See how your trading strategies rank/)).toBeInTheDocument();
  });

  it('should not render for BASIC users', () => {
    renderWithProviders(<LeaderboardGate currentTier="BASIC" />);

    expect(screen.queryByText('Leaderboard')).not.toBeInTheDocument();
  });

  it('should not render for PREMIUM users', () => {
    renderWithProviders(<LeaderboardGate currentTier="PREMIUM" />);

    expect(screen.queryByText('Leaderboard')).not.toBeInTheDocument();
  });

  it('should display leaderboard benefits', () => {
    renderWithProviders(<LeaderboardGate currentTier="FREE" />);

    expect(screen.getByText('View global strategy rankings')).toBeInTheDocument();
    expect(screen.getByText('Compare your performance with top traders')).toBeInTheDocument();
  });
});

describe('MarketplaceGate', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render for FREE users', () => {
    renderWithProviders(<MarketplaceGate currentTier="FREE" />);

    expect(screen.getByText('Strategies Marketplace')).toBeInTheDocument();
    expect(screen.getByText(/Access our community marketplace/)).toBeInTheDocument();
  });

  it('should not render for BASIC users', () => {
    renderWithProviders(<MarketplaceGate currentTier="BASIC" />);

    expect(screen.queryByText('Strategies Marketplace')).not.toBeInTheDocument();
  });

  it('should display marketplace benefits', () => {
    renderWithProviders(<MarketplaceGate currentTier="FREE" />);

    expect(screen.getByText('Browse public trading strategies')).toBeInTheDocument();
    expect(screen.getByText('Copy strategies to your account')).toBeInTheDocument();
  });
});
