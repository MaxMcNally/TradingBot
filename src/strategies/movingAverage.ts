export type Signal = 'BUY' | 'SELL' | null;

export class MovingAverageStrategy {
  private shortWindow: number;
  private longWindow: number;
  private prices: number[] = [];

  constructor(shortWindow: number = 5, longWindow: number = 10) {
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
  }

  addPrice(price: number): void {
    this.prices.push(price);
    if (this.prices.length > this.longWindow) {
      this.prices.shift();
    }
  }

  getSignal(): Signal {
    if (this.prices.length < this.longWindow) return null;

    const shortMA = avg(this.prices.slice(-this.shortWindow));
    const longMA = avg(this.prices);

    if (shortMA > longMA) return 'BUY';
    if (shortMA < longMA) return 'SELL';
    return null;
  }
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
