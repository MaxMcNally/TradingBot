export const TradingMode = {
  PAPER: 'paper',
  LIVE: 'live',
} as const;

export type TradingModeType = typeof TradingMode[keyof typeof TradingMode];
