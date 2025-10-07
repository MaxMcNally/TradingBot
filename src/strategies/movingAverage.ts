import { AbstractStrategy, Signal } from './baseStrategy';

export { Signal };

export class MovingAverageStrategy extends AbstractStrategy {
  private shortWindow: number;
  private longWindow: number;
  private longSum: number = 0;
  private shortSum: number = 0;

  constructor(shortWindow: number = 5, longWindow: number = 10) {
    super();
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
  }

  addPrice(price: number): void {
    // Maintain a rolling window up to longWindow and rolling sums for O(1) MAs
    const preLength = this.prices.length;

    // Determine the value that will fall out of the short window (if any)
    let shortOutgoing = 0;
    if (preLength >= this.shortWindow) {
      shortOutgoing = this.prices[preLength - this.shortWindow];
    }

    // Push new price
    this.prices.push(price);
    this.longSum += price;
    this.shortSum += price;

    // Adjust short rolling sum when we exceed short window
    if (preLength >= this.shortWindow) {
      this.shortSum -= shortOutgoing;
    }

    // Trim to long window and adjust long rolling sum
    if (this.prices.length > this.longWindow) {
      const removed = this.prices.shift()!;
      this.longSum -= removed;
      // If shortWindow == longWindow, we've already subtracted the removed from shortSum above
    }
  }

  getSignal(): Signal {
    if (this.prices.length < this.longWindow) return null;

    const shortMA = this.shortSum / this.shortWindow;
    const longMA = this.longSum / this.longWindow;

    if (shortMA > longMA) return 'BUY';
    if (shortMA < longMA) return 'SELL';
    return null;
  }

  getStrategyName(): string {
    return 'MovingAverage';
  }
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
