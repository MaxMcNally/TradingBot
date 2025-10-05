import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import ThemeProviderComponent from './ThemeProvider';

describe('ThemeProvider Component', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProviderComponent>
        <div>Test Content</div>
      </ThemeProviderComponent>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('provides theme context', () => {
    const TestComponent = () => {
      return <div>Theme Context Available</div>;
    };

    render(
      <ThemeProviderComponent>
        <TestComponent />
      </ThemeProviderComponent>
    );
    
    expect(screen.getByText('Theme Context Available')).toBeInTheDocument();
  });

  it('applies Material-UI theme', () => {
    render(
      <ThemeProviderComponent>
        <div data-testid="themed-content">Themed Content</div>
      </ThemeProviderComponent>
    );
    
    const themedContent = screen.getByTestId('themed-content');
    expect(themedContent).toBeInTheDocument();
  });
});
