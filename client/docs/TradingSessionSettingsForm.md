# TradingSessionSettingsForm Component

A reusable React component for creating and editing trading session settings.

## Usage

### Basic Example

```tsx
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';
import { useTradingSessionSettings } from '../../hooks/useTradingSessionSettings';

function MyComponent({ sessionId }: { sessionId: number }) {
  const { settings, updateSettings, isUpdating } = useTradingSessionSettings(sessionId);

  const handleSubmit = async (newSettings: Partial<TradingSessionSettings>) => {
    await updateSettings(newSettings);
  };

  return (
    <TradingSessionSettingsForm
      initialSettings={settings || undefined}
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      submitLabel="Update Settings"
    />
  );
}
```

### Creating a Session with Settings

```tsx
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';
import { useTradingSessionManagement } from '../../hooks/useTrading';

function CreateSessionForm({ userId }: { userId: number }) {
  const { startSession, isLoading } = useTradingSessionManagement();
  const [showSettings, setShowSettings] = useState(false);
  const [sessionSettings, setSessionSettings] = useState<Partial<TradingSessionSettings>>({});

  const handleStartSession = async () => {
    await startSession({
      userId,
      mode: 'PAPER',
      initialCash: 10000,
      symbols: ['AAPL'],
      strategy: 'momentum',
      settings: sessionSettings,
    });
  };

  const handleSettingsSubmit = async (settings: Partial<TradingSessionSettings>) => {
    setSessionSettings(settings);
    setShowSettings(false);
  };

  return (
    <>
      <Button onClick={() => setShowSettings(true)}>Configure Settings</Button>
      {showSettings && (
        <TradingSessionSettingsForm
          initialSettings={sessionSettings}
          onSubmit={handleSettingsSubmit}
          onCancel={() => setShowSettings(false)}
          submitLabel="Apply Settings"
        />
      )}
      <Button onClick={handleStartSession} disabled={isLoading}>
        Start Session
      </Button>
    </>
  );
}
```

## Props

- `initialSettings?: Partial<TradingSessionSettings>` - Initial settings values
- `onSubmit: (settings: Partial<TradingSessionSettings>) => Promise<void>` - Callback when form is submitted
- `onCancel?: () => void` - Optional cancel callback
- `isLoading?: boolean` - Loading state
- `submitLabel?: string` - Custom submit button label (default: "Save Settings")
- `showAdvanced?: boolean` - Whether to show advanced section by default

## Features

- ✅ Comprehensive form validation
- ✅ Organized into collapsible sections:
  - Risk Management
  - Order Execution
  - Position Management
  - Trading Window
  - Advanced Settings
- ✅ Material UI components
- ✅ Type-safe with TypeScript
- ✅ Responsive design

