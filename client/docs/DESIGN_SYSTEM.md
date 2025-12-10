# 🎨 Design System: The Bureau Terminal

## 1. Aesthetic & Philosophy
**"The future, as imagined by the past."**

This application rejects the hyper-clean, weightless feel of modern fintech (Coinbase, Robinhood) in favor of **tactile, weighty, and mechanical** design. The user is not just using software; they are operating a machine.

### Inspirations
* **Loki (TVA):** Analog bureaucracy, amber phosphors, safety orange, rounded CRT monitors.
* **Severance (Lumon):** Brutalist grids, sterile corridors, deep greens, mid-century corporate typography.
* **50s Sci-Fi:** Physical switches, punch cards, cautionary indicator lights, heavy steel panels.

---

## 2. The Themes (Font Variations)

We support three distinct "flavors" of this aesthetic based on typography.

### Variation A: "THE LUMON" (Space Grotesk)
* **Vibe:** Corporate, odd, brutalist, "Uncanny Valley."
* **Best For:** If you want the app to feel like a mysterious corporate dashboard.
* **Font:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
* **Characteristics:** Geometric sans-serif with quirky details (see the lowercase 'g'). High distinctiveness.

### Variation B: "THE TIMEKEEPER" (Rajdhani)
* **Vibe:** Technical, engineered, modular, "The Robot."
* **Best For:** Data density. The squared-off letters look like a heads-up display (HUD) or technical schematic.
* **Font:** [Rajdhani](https://fonts.google.com/specimen/Rajdhani)
* **Characteristics:** Condensed width, squared corners, highly mechanical.

### Variation C: "STANDARD ISSUE" (IBM Plex Sans)
* **Vibe:** Reliable, industrial, man-machine interface.
* **Best For:** Maximum readability while maintaining a strict "government issue" feel.
* **Font:** [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans)
* **Characteristics:** Neutral but technical. The "safe" retro choice.

---

## 3. Color System

We utilize two modes. **Dark Mode** mimics a CRT terminal or server room. **Light Mode** mimics a bureaucratic office (paper, manila folders, ink).

### 🌑 Dark Mode (The Terminal)
| Token | Hex | Description |
| :--- | :--- | :--- |
| **Background** | `#121416` | Deep Charcoal (almost black, but warm) |
| **Paper/Card** | `#1d2125` | Heavy Industrial Metal |
| **Primary** | `#ffb74d` | Phosphor Amber (The Glow) |
| **Secondary** | `#80cbc4` | Faded Teal (Dashboard Instruments) |
| **Text Primary** | `#e0e0e0` | Off-white (prevent eye strain) |
| **Border** | `#333` | Subtle definition |

### ☀️ Light Mode (The Bureau)
| Token | Hex | Description |
| :--- | :--- | :--- |
| **Background** | `#e3e4db` | Aged Concrete / Putty |
| **Paper/Card** | `#f2f0e9` | Manila Folder / Bond Paper |
| **Primary** | `#e65100` | Safety Orange / Burnt Sienna (Stamp Ink) |
| **Secondary** | `#00695c` | Dark Teal (Typewriter Ribbon) |
| **Text Primary** | `#263238` | Faded Carbon Ink |
| **Border** | `#b0bec5` | Metal filing cabinet grey |

---

## 4. Implementation Guide (`theme.js`)

Copy the configuration below. Switch the `currentTheme` and `mode` variables to toggle looks.

```javascript
import { createTheme, alpha } from '@mui/material/styles';

// 1. CONFIGURATION ------------------------------------------------
const MODE = 'dark'; // 'light' or 'dark'
const FONT_THEME = 'RAJDHANI'; // 'SPACE_GROTESK', 'RAJDHANI', or 'IBM_PLEX'

// 2. PALETTES -----------------------------------------------------
const paletteTokens = {
  dark: {
    bg: '#121416',
    paper: '#1d2125',
    primary: '#ffb74d', // Amber
    secondary: '#80cbc4', // Soft Teal
    text: '#e0e0e0',
    border: 'rgba(255, 183, 77, 0.2)',
  },
  light: {
    bg: '#e3e4db', // Putty
    paper: '#f2f0e9', // Manila
    primary: '#d84315', // Burnt Orange
    secondary: '#00695c', // Deep Teal
    text: '#263238', // Dark Grey Ink
    border: 'rgba(0, 0, 0, 0.12)',
  }
};

const colors = paletteTokens[MODE];

// 3. TYPOGRAPHY STRATEGIES ----------------------------------------
const fontStrategies = {
  SPACE_GROTESK: {
    headers: '"Space Grotesk", sans-serif',
    body: '"Space Grotesk", sans-serif',
    code: '"JetBrains Mono", monospace',
    headerWeight: 700,
  },
  RAJDHANI: {
    headers: '"Rajdhani", sans-serif',
    body: '"Rajdhani", sans-serif', // Use 500 weight for better read
    code: '"JetBrains Mono", monospace',
    headerWeight: 700,
  },
  IBM_PLEX: {
    headers: '"IBM Plex Sans", sans-serif',
    body: '"IBM Plex Sans", sans-serif',
    code: '"IBM Plex Mono", monospace',
    headerWeight: 600,
  }
};

const activeFont = fontStrategies[FONT_THEME];

// 4. THEME CREATION -----------------------------------------------
const theme = createTheme({
  palette: {
    mode: MODE,
    background: { default: colors.bg, paper: colors.paper },
    primary: { main: colors.primary },
    secondary: { main: colors.secondary },
    text: { primary: colors.text },
    divider: colors.border,
  },
  typography: {
    fontFamily: activeFont.body,
    h1: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight, letterSpacing: '-0.02em' },
    h2: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight },
    h3: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight },
    h4: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight },
    h5: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight },
    h6: { fontFamily: activeFont.headers, fontWeight: activeFont.headerWeight, textTransform: 'uppercase', letterSpacing: '0.05em' },
    button: { fontFamily: activeFont.headers, fontWeight: 700 },
    subtitle1: { fontFamily: activeFont.code }, // Use monospace for data labels
    caption: { fontFamily: activeFont.code },   // Use monospace for small timestamps
  },
  shape: {
    borderRadius: 0, // Brutalist Sharp Edges
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.border}`,
          boxShadow: MODE === 'light' ? '2px 2px 0px 0px #b0bec5' : '4px 4px 0px 0px rgba(0,0,0,0.5)',
          '&:hover': {
            backgroundColor: alpha(colors.primary, 0.1),
            transform: 'translate(-1px, -1px)',
            boxShadow: MODE === 'light' ? '3px 3px 0px 0px #b0bec5' : '5px 5px 0px 0px rgba(0,0,0,0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.bg,
          color: colors.text,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;