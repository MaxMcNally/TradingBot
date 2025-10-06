export const TradingMode = {
  PAPER: 'PAPER',
  LIVE: 'LIVE',
} as const;

export type TradingModeType = typeof TradingMode[keyof typeof TradingMode];
