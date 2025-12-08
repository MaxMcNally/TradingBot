/**
 * Test helpers for indicator tests
 */

import { PriceData } from '../../../utils/indicators/types';

/**
 * Generate sample price data for testing
 */
export function generatePriceData(
  count: number,
  startPrice: number = 100,
  volatility: number = 1
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;

  for (let i = 0; i < count; i++) {
    // Random walk with some volatility
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(0.01, currentPrice + change);

    const high = currentPrice + Math.random() * volatility;
    const low = currentPrice - Math.random() * volatility;
    const open = i === 0 ? currentPrice : data[i - 1].close;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      open,
      high,
      low,
      close: currentPrice,
      volume
    });
  }

  return data;
}

/**
 * Generate trending price data (upward or downward)
 */
export function generateTrendingData(
  count: number,
  startPrice: number = 100,
  trend: 'up' | 'down' = 'up',
  strength: number = 0.5
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  const direction = trend === 'up' ? 1 : -1;

  for (let i = 0; i < count; i++) {
    const change = direction * strength * (1 + Math.random() * 0.5);
    currentPrice = Math.max(0.01, currentPrice + change);

    const high = currentPrice + Math.random() * 2;
    const low = currentPrice - Math.random() * 2;
    const open = i === 0 ? currentPrice : data[i - 1].close;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      open,
      high,
      low,
      close: currentPrice,
      volume
    });
  }

  return data;
}

/**
 * Generate constant price data
 */
export function generateConstantData(
  count: number,
  price: number = 100
): PriceData[] {
  const data: PriceData[] = [];

  for (let i = 0; i < count; i++) {
    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      open: price,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000000
    });
  }

  return data;
}

