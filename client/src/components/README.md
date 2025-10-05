# Components Structure

This directory contains all React components organized in individual folders. Each component folder follows a consistent structure:

## Folder Structure

```
ComponentName/
├── ComponentName.jsx          # Main component file
├── ComponentName.types.ts     # TypeScript interfaces and types
├── ComponentName.spec.js      # Test file
├── index.js                   # Export file for clean imports
└── README.md                  # Component documentation (optional)
```

## Components

### AppLayout
- **Purpose**: Main application layout with navigation
- **Props**: `children` (React.ReactNode)
- **Features**: Navigation menu, user menu, responsive design

### Backtesting
- **Purpose**: Strategy backtesting interface with real-time symbol search
- **Props**: None (uses internal state)
- **Features**: Yahoo Finance integration, symbol search, backtest execution

### Container
- **Purpose**: Wrapper component for consistent spacing and layout
- **Props**: `children`, `maxWidth`, `sx`
- **Features**: Material-UI Container with customization options

### Dashboard
- **Purpose**: Main dashboard with portfolio overview and quick actions
- **Props**: None (uses internal state)
- **Features**: Portfolio stats, recent activity, navigation shortcuts

### Login
- **Purpose**: User authentication form
- **Props**: `setUser` (function)
- **Features**: Form validation, error handling, loading states

### Settings
- **Purpose**: User settings and preferences management
- **Props**: `user` (User object)
- **Features**: Settings persistence, form validation, user info display

### Signup
- **Purpose**: User registration form
- **Props**: `setUser` (function)
- **Features**: Form validation, password confirmation, error handling

### ThemeProvider
- **Purpose**: Material-UI theme provider wrapper
- **Props**: `children` (React.ReactNode)
- **Features**: Theme context, dark/light mode support

## Usage

Import components using the clean import syntax:

```javascript
import AppLayout from './components/AppLayout';
import Backtesting from './components/Backtesting';
import Login from './components/Login';
```

## Testing

Each component includes comprehensive test coverage:

- Unit tests for component rendering
- Integration tests for user interactions
- API mocking for external dependencies
- Error handling and edge case testing

Run tests with:
```bash
npm test
```

## TypeScript Support

All components include TypeScript interface definitions in `.types.ts` files for:
- Component props
- API response types
- Form data structures
- State management types
