# Frontend Trading Session Settings Implementation

## Overview

This document describes the frontend implementation for trading session settings, including a reusable component and React hook for managing session settings.

## Components Created

### 1. TradingSessionSettingsForm Component

**Location**: `client/src/components/TradingSessionSettingsForm/TradingSessionSettingsForm.tsx`

A comprehensive, reusable form component for creating and editing trading session settings.

**Features:**
- ✅ Organized into collapsible sections (Accordions)
- ✅ Full validation with error messages
- ✅ Material UI components
- ✅ Type-safe with TypeScript
- ✅ Responsive design
- ✅ Supports all settings from the spec

**Sections:**
1. **Risk Management**: Stop loss, take profit, position limits, daily loss limits
2. **Order Execution**: Time in force, order types, extended hours, partial fills
3. **Position Management**: Max positions, sizing method, rebalance frequency
4. **Trading Window**: Trading hours and days
5. **Advanced**: Trailing stops, bracket orders, slippage, commission

### 2. useTradingSessionSettings Hook

**Location**: `client/src/hooks/useTradingSessionSettings/useTradingSessionSettings.ts`

A React Query hook for querying and mutating trading session settings.

**Features:**
- ✅ Automatic caching and refetching
- ✅ Optimistic updates
- ✅ Error handling
- ✅ Loading states
- ✅ Query invalidation on mutations

**API:**
```typescript
const {
  settings,           // Current settings or null
  isLoading,          // Loading state
  isError,            // Error state
  error,              // Error object
  refetch,            // Manual refetch function
  createSettings,     // Create settings mutation
  updateSettings,     // Update settings mutation
  isCreating,         // Creating state
  isUpdating,         // Updating state
} = useTradingSessionSettings(sessionId);
```

### 3. Updated Trading API

**Location**: `client/src/api/tradingApi.ts`

Added types and API functions for session settings:

**New Types:**
- `TradingSessionSettings` - Complete settings interface
- `TradingSessionWithSettings` - Session with settings
- `TimeInForce`, `OrderType`, `PositionSizingMethod`, etc. - Type aliases

**New API Functions:**
- `getSessionSettings(sessionId)` - Get settings for a session
- `createSessionSettings(sessionId, settings)` - Create settings
- `updateSessionSettings(sessionId, settings)` - Update settings

**Updated:**
- `StartTradingSessionRequest` - Now includes optional `settings` field
- `StartTradingSessionResponse` - Now includes session with settings
- `getActiveTradingSession` - Now returns session with settings

## Usage Examples

### Example 1: Creating a Session with Settings

```tsx
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';
import { useTradingSessionManagement } from '../../hooks/useTrading';
import { useState } from 'react';

function CreateSessionWithSettings({ userId }: { userId: number }) {
  const { startSession, isLoading } = useTradingSessionManagement();
  const [showSettings, setShowSettings] = useState(false);
  const [sessionSettings, setSessionSettings] = useState({});

  const handleSettingsSubmit = async (settings: any) => {
    setSessionSettings(settings);
    setShowSettings(false);
  };

  const handleStartSession = async () => {
    await startSession({
      userId,
      mode: 'PAPER',
      initialCash: 10000,
      symbols: ['AAPL', 'MSFT'],
      strategy: 'momentum',
      settings: sessionSettings, // Include settings
    });
  };

  return (
    <>
      <Button onClick={() => setShowSettings(true)}>
        Configure Settings
      </Button>
      
      {showSettings && (
        <TradingSessionSettingsForm
          initialSettings={sessionSettings}
          onSubmit={handleSettingsSubmit}
          onCancel={() => setShowSettings(false)}
          submitLabel="Apply Settings"
        />
      )}
      
      <Button 
        onClick={handleStartSession} 
        disabled={isLoading}
      >
        Start Session
      </Button>
    </>
  );
}
```

### Example 2: Editing Settings for Active Session

```tsx
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';
import { useTradingSessionSettings } from '../../hooks/useTradingSessionSettings';

function EditSessionSettings({ sessionId }: { sessionId: number }) {
  const { settings, updateSettings, isUpdating } = useTradingSessionSettings(sessionId);

  const handleSubmit = async (newSettings: any) => {
    await updateSettings(newSettings);
  };

  if (!settings) {
    return <div>No settings found</div>;
  }

  return (
    <TradingSessionSettingsForm
      initialSettings={settings}
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      submitLabel="Update Settings"
    />
  );
}
```

### Example 3: Displaying Settings

```tsx
import { useTradingSessionSettings } from '../../hooks/useTradingSessionSettings';
import { Box, Typography, Chip } from '@mui/material';

function SessionSettingsDisplay({ sessionId }: { sessionId: number }) {
  const { settings, isLoading } = useTradingSessionSettings(sessionId);

  if (isLoading) return <div>Loading...</div>;
  if (!settings) return <div>No settings</div>;

  return (
    <Box>
      <Typography variant="h6">Session Settings</Typography>
      <Typography>Stop Loss: {settings.stop_loss_percentage ?? 'Disabled'}%</Typography>
      <Typography>Take Profit: {settings.take_profit_percentage ?? 'Disabled'}%</Typography>
      <Typography>Max Position Size: {settings.max_position_size_percentage}%</Typography>
      <Typography>Max Open Positions: {settings.max_open_positions}</Typography>
      <Box>
        Trading Days: {settings.trading_days.map(day => (
          <Chip key={day} label={day} size="small" />
        ))}
      </Box>
    </Box>
  );
}
```

## Integration Points

### With Existing Trading Session Management

The settings can be integrated into the existing `TradingSessionControls` component:

```tsx
// In TradingSessionControls.tsx
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';

// Add state for settings
const [showSettingsDialog, setShowSettingsDialog] = useState(false);
const [sessionSettings, setSessionSettings] = useState({});

// In the start session handler
const request: StartTradingSessionRequest = {
  userId,
  mode,
  initialCash,
  symbols: selectedStocks,
  strategy: selectedStrategy,
  settings: sessionSettings, // Include settings
};

// Add settings button
<Button onClick={() => setShowSettingsDialog(true)}>
  <Settings /> Configure Settings
</Button>

{showSettingsDialog && (
  <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)}>
    <TradingSessionSettingsForm
      initialSettings={sessionSettings}
      onSubmit={async (settings) => {
        setSessionSettings(settings);
        setShowSettingsDialog(false);
      }}
      onCancel={() => setShowSettingsDialog(false)}
      submitLabel="Apply Settings"
    />
  </Dialog>
)}
```

## File Structure

```
client/src/
├── api/
│   └── tradingApi.ts                    # Updated with settings types and API functions
├── components/
│   └── TradingSessionSettingsForm/
│       ├── TradingSessionSettingsForm.tsx
│       ├── index.ts
│       └── README.md
└── hooks/
    └── useTradingSessionSettings/
        ├── useTradingSessionSettings.ts
        └── index.ts
```

## Type Safety

All components and hooks are fully typed with TypeScript:

- `TradingSessionSettings` - Complete settings interface
- `TradingSessionSettingsFormProps` - Component props
- `UseTradingSessionSettingsReturn` - Hook return type
- All API functions have proper return types

## Validation

The form component includes client-side validation:

- Percentage values: 0-100 range
- Time format: HH:mm validation
- Trading hours: End time must be after start time
- Required fields: Max position size, max open positions, etc.

Server-side validation is handled by the backend API.

## Next Steps

1. **Integrate into TradingSessionControls**: Add settings configuration to the existing session start flow
2. **Add Settings Display**: Show current settings in the active session view
3. **Settings Templates**: Allow users to save and reuse common settings configurations
4. **Validation Feedback**: Enhance error messages and validation feedback
5. **Settings Presets**: Provide pre-configured settings for different trading styles

## Testing

Recommended tests:

1. **Component Tests**:
   - Form validation
   - Field updates
   - Submit handling
   - Cancel handling

2. **Hook Tests**:
   - Query fetching
   - Mutation success/error handling
   - Cache invalidation

3. **Integration Tests**:
   - Creating session with settings
   - Updating settings for active session
   - Settings persistence

