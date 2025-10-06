import { AbstractStrategy, Signal } from './baseStrategy';

export { Signal };

export class MovingAverageStrategy extends AbstractStrategy {
  private shortWindow: number;
  private longWindow: number;

  constructor(shortWindow: number = 5, longWindow: number = 10) {
    super();
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
  }

  addPrice(price: number): void {
    this.addPriceToHistory(price, this.longWindow);
  }

  getSignal(): Signal {
    if (this.prices.length < this.longWindow) return null;

    const shortMA = this.getAverage(this.prices.slice(-this.shortWindow));
    const longMA = this.getAverage(this.prices);

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
