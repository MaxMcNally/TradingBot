# Theme System Documentation

## Overview

The TradingBot client application now includes a comprehensive Material UI theme system with both light and dark modes. The themes are designed specifically for financial services applications with professional, sleek styling.

## Features

- **Professional Light Theme**: Clean, modern design with subtle shadows and professional color palette
- **Professional Dark Theme**: Dark mode optimized for low-light environments with high contrast
- **Automatic Theme Persistence**: User's theme preference is saved to localStorage
- **System Preference Detection**: Automatically detects user's system theme preference on first visit
- **Dynamic System Theme Following**: Automatically updates when user changes their system theme (if no manual preference is set)
- **Theme Toggle Component**: Easy-to-use toggle button for switching between themes
- **Enhanced Theme Menu**: Dropdown menu with Light, Dark, and System options

## Theme Colors

### Light Theme
- **Primary**: Deep professional blue (#1e3a8a)
- **Secondary**: Professional green for positive values (#059669)
- **Error**: Professional red for negative values (#dc2626)
- **Warning**: Professional amber for warnings (#d97706)
- **Info**: Professional cyan for info (#0284c7)
- **Background**: Very light gray (#f8fafc)
- **Paper**: Pure white (#ffffff)

### Dark Theme
- **Primary**: Bright blue (#3b82f6)
- **Secondary**: Bright green for positive values (#10b981)
- **Error**: Bright red for negative values (#ef4444)
- **Warning**: Bright amber for warnings (#f59e0b)
- **Info**: Bright cyan for info (#0ea5e9)
- **Background**: Very dark blue-gray (#0f172a)
- **Paper**: Dark blue-gray (#1e293b)

## Usage

### Using the Theme Context

```tsx
import { useTheme } from '../components/ThemeProvider';

const MyComponent = () => {
  const { mode, theme, toggleTheme, resetToSystemTheme } = useTheme();
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <button onClick={toggleTheme}>
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </button>
      <button onClick={resetToSystemTheme}>
        Reset to system theme
      </button>
    </div>
  );
};
```

### Using the Theme Toggle Component

```tsx
import ThemeToggle, { EnhancedThemeToggle } from '../components/ThemeToggle';

const Header = () => {
  return (
    <AppBar>
      <Toolbar>
        {/* Other header content */}
        <ThemeToggle size="small" showTooltip={true} />
        
        {/* Or use the enhanced version with dropdown menu */}
        <EnhancedThemeToggle variant="enhanced" size="small" />
      </Toolbar>
    </AppBar>
  );
};
```

### Theme Toggle Props

**ThemeToggle:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `showTooltip`: boolean (default: true)

**EnhancedThemeToggle:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `showTooltip`: boolean (default: true)
- `variant`: 'simple' | 'enhanced' (default: 'simple')

## File Structure

```
src/
├── themes/
│   ├── index.ts          # Theme exports
│   ├── lightTheme.ts     # Light theme configuration
│   └── darkTheme.ts      # Dark theme configuration
├── components/
│   ├── ThemeProvider/
│   │   ├── index.ts      # Main exports
│   │   ├── ThemeProvider.tsx    # Main provider component
│   │   ├── ThemeContext.tsx     # Theme context and hook
│   │   └── ThemeProvider.types.ts # Type definitions
│   └── ThemeToggle/
│       ├── index.ts      # Component exports
│       ├── ThemeToggle.tsx      # Toggle button component
│       └── ThemeToggle.types.ts # Component types
```

## Integration

The theme system is automatically integrated into the main App component through the ThemeProvider. The theme toggle is included in the Header component for easy access.

## Customization

To customize the themes, edit the theme files in `src/themes/`:

1. **lightTheme.ts**: Modify the light theme colors, typography, and component styles
2. **darkTheme.ts**: Modify the dark theme colors, typography, and component styles

Both themes use Material UI's `createTheme` function and follow the same structure for consistency.

## Typography

Both themes use the Inter font family for a modern, professional appearance:

```tsx
fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
```

## Component Styling

The themes include custom styling for common components:

- **Buttons**: Rounded corners, no text transformation, subtle shadows on hover
- **Cards**: Rounded corners, subtle borders, professional shadows
- **Text Fields**: Rounded corners, custom focus colors
- **App Bar**: Custom background colors and borders
- **Drawer**: Custom background colors and borders

## Accessibility

Both themes are designed with accessibility in mind:

- High contrast ratios for text readability
- Clear visual hierarchy
- Consistent color usage for semantic meaning (green for positive, red for negative)
- Proper focus indicators

## System Theme Detection

The theme system automatically detects and responds to the user's system theme preferences:

### How It Works

1. **Initial Detection**: On first visit, the app checks `window.matchMedia('(prefers-color-scheme: dark)')` to detect the system preference
2. **Dynamic Updates**: If the user hasn't manually set a preference, the app will automatically update when they change their system theme
3. **User Override**: Once a user manually changes the theme, their preference is saved and takes priority over system settings
4. **Reset Option**: Users can reset to system theme using the `resetToSystemTheme()` function or the enhanced theme toggle

### Testing System Theme Detection

To test the system theme detection:

1. **Clear localStorage**: Remove the `themeMode` key from localStorage
2. **Change system theme**: Switch your OS between light and dark mode
3. **Refresh the page**: The app should automatically match your system preference
4. **Manual override**: Click the theme toggle to set a manual preference
5. **System changes ignored**: After manual override, system changes won't affect the app
6. **Reset to system**: Use the enhanced theme toggle to reset to system preference

## Browser Support

The theme system works in all modern browsers and includes:

- CSS custom properties for dynamic theming
- localStorage for theme persistence
- System preference detection via `prefers-color-scheme`
- Real-time system theme change detection
- Proper focus indicators
