import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

const MockAppLayout = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppLayout>{children}</AppLayout>
  </BrowserRouter>
);

describe('AppLayout Component', () => {
  it('renders layout with children', () => {
    render(
      <MockAppLayout>
        <div>Test Content</div>
      </MockAppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with header when provided', () => {
    render(
      <MockAppLayout>
        <AppLayout header={<div>Header Content</div>}>
          <div>Test Content</div>
        </AppLayout>
      </MockAppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with footer when provided', () => {
    render(
      <MockAppLayout>
        <AppLayout footer={<div>Footer Content</div>}>
          <div>Test Content</div>
        </AppLayout>
      </MockAppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with sidebar when provided', () => {
    render(
      <MockAppLayout>
        <AppLayout sidebar={<div>Sidebar Content</div>}>
          <div>Test Content</div>
        </AppLayout>
      </MockAppLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
