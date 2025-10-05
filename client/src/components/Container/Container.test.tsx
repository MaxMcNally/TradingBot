import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Container from './Container';

describe('Container Component', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default maxWidth', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    );
    
    const container = screen.getByText('Test Content').closest('[class*="MuiContainer"]');
    expect(container).toBeInTheDocument();
  });

  it('applies custom maxWidth', () => {
    render(
      <Container maxWidth="sm">
        <div>Test Content</div>
      </Container>
    );
    
    const container = screen.getByText('Test Content').closest('[class*="MuiContainer"]');
    expect(container).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const customSx = { backgroundColor: 'red' };
    
    render(
      <Container sx={customSx}>
        <div>Test Content</div>
      </Container>
    );
    
    const container = screen.getByText('Test Content').closest('[class*="MuiContainer"]');
    expect(container).toBeInTheDocument();
  });
});
