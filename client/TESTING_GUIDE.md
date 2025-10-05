# Testing Guide for Trading Bot Client

## Overview

This guide covers the comprehensive test suite for the Trading Bot client application, including the updated Dashboard and Backtesting components with their new tabbed interfaces.

## Test Structure

### Updated Components with Tests

1. **Dashboard Component** (`src/components/Dashboard/Dashboard.test.tsx`)
   - Tests the new tabbed interface with 5 tabs
   - Covers tab navigation and content switching
   - Tests user loading states and error handling
   - Validates proper prop passing to child components

2. **Backtesting Component** (`src/components/Backtesting/Backtesting.test.tsx`)
   - Tests the new 4-tab backtesting interface
   - Covers strategy selection, parameters, data settings, and results
   - Tests form validation and backtest execution
   - Validates proper hook integration

3. **StrategySelector Component** (`src/components/shared/StrategySelector.test.tsx`)
   - Tests strategy selection and parameter configuration
   - Covers parameter type handling (number, string, boolean)
   - Tests parameter validation and default value setting
   - Validates proper callback execution

4. **TradingSessionControls Component** (`src/components/Dashboard/TradingSessionControls.test.tsx`)
   - Tests session configuration with time controls
   - Covers market status display and scheduled end times
   - Tests session start/stop functionality
   - Validates form validation and error handling

5. **TestDataManager Component** (`src/components/Dashboard/TestDataManager.test.tsx`)
   - Tests test user creation and cleanup
   - Covers mock session management
   - Tests configuration and session lifecycle
   - Validates API integration

## Running Tests

### Prerequisites

Make sure you have all dependencies installed:
```bash
cd client
npm install
```

### Running All Tests
```bash
npm test
```

### Running Tests in Watch Mode
```bash
npm test -- --watch
```

### Running Specific Test Files
```bash
# Run Dashboard tests
npm test -- --run src/components/Dashboard/Dashboard.test.tsx

# Run Backtesting tests
npm test -- --run src/components/Backtesting/Backtesting.test.tsx

# Run StrategySelector tests
npm test -- --run src/components/shared/StrategySelector.test.tsx

# Run TradingSessionControls tests
npm test -- --run src/components/Dashboard/TradingSessionControls.test.tsx

# Run TestDataManager tests
npm test -- --run src/components/Dashboard/TestDataManager.test.tsx
```

### Running Tests with Coverage
```bash
npm test -- --coverage
```

## Test Configuration

### Setup Files
- `src/setupTests.js` - Global test setup with mocks for:
  - `window.matchMedia`
  - `IntersectionObserver`
  - `ResizeObserver`
  - `localStorage` and `sessionStorage`
  - `window.location.reload`
  - Console methods

### Vitest Configuration
- Environment: `jsdom` for DOM testing
- Global test utilities available
- CSS support enabled
- Coverage reporting with v8 provider

## Mocking Strategy

### API Mocks
All API calls are mocked using Jest mocks:
- `useUser` hook for user data
- `useStrategies` hook for strategy data
- `useBacktest` hook for backtest operations
- Trading API functions for session management

### Component Mocks
Child components are mocked to focus on the component under test:
- `TradingResults` - Mocked with test IDs
- `TradingSessionControls` - Mocked with test IDs
- `TestDataManager` - Mocked with test IDs
- `StockPicker` - Mocked with interactive test buttons
- `StrategySelector` - Mocked with parameter display

## Test Patterns

### Component Testing
```typescript
// Basic component rendering
it('renders component correctly', () => {
  renderWithQueryClient(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});

// User interaction testing
it('handles user interactions', () => {
  renderWithQueryClient(<Component />);
  const button = screen.getByText('Button Text');
  fireEvent.click(button);
  expect(mockFunction).toHaveBeenCalled();
});

// Async operation testing
it('handles async operations', async () => {
  renderWithQueryClient(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded Content')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// Hook testing with QueryClient
it('returns data from hook', async () => {
  const { result } = renderHook(() => useCustomHook(), {
    wrapper: createWrapper()
  });
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

## Key Test Features

### Tab Navigation Testing
Tests verify that:
- All tabs are rendered correctly
- Tab switching works properly
- Content is hidden/shown appropriately
- Accessibility attributes are correct

### Form Validation Testing
Tests verify that:
- Required fields are validated
- Input types are handled correctly
- Error messages are displayed
- Form submission works with valid data

### State Management Testing
Tests verify that:
- Component state updates correctly
- Props are passed to child components
- Callbacks are executed properly
- Loading and error states are handled

### API Integration Testing
Tests verify that:
- API calls are made with correct parameters
- Success responses are handled
- Error responses are handled
- Loading states are managed

## Troubleshooting

### Common Issues

1. **SSR Export Name Error**
   - Fixed in `vite.config.ts` with proper define configuration
   - Ensure `__vite_ssr_exportName__` is defined as 'undefined'

2. **Component Import Errors**
   - Use proper mocking for complex components
   - Ensure all dependencies are properly mocked

3. **Async Test Issues**
   - Use `waitFor` for async operations
   - Ensure proper cleanup in `beforeEach`/`afterEach`

4. **QueryClient Issues**
   - Use `createTestQueryClient` helper
   - Wrap components with `QueryClientProvider`

### Debug Tips

1. **Use `screen.debug()`** to see the rendered DOM
2. **Check console logs** for mock function calls
3. **Verify mock implementations** match expected behavior
4. **Use `waitFor`** for async state updates

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Future Improvements

1. **Integration Tests** - Test complete user workflows
2. **Visual Regression Tests** - Test UI consistency
3. **Performance Tests** - Test component rendering performance
4. **Accessibility Tests** - Test keyboard navigation and screen readers

## Contributing

When adding new tests:
1. Follow the existing patterns
2. Mock external dependencies
3. Test both success and error cases
4. Include accessibility testing
5. Update this guide if needed
