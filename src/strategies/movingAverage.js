export class MovingAverageStrategy {
  constructor(shortWindow = 5, longWindow = 10) {
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
    this.prices = [];
  }

  addPrice(price) {
    this.prices.push(price);
    if (this.prices.length > this.longWindow) {
      this.prices.shift();
    }
  }

  getSignal() {
    if (this.prices.length < this.longWindow) return null;

    const shortMA = avg(this.prices.slice(-this.shortWindow));
    const longMA = avg(this.prices);

    if (shortMA > longMA) return "BUY";
    if (shortMA < longMA) return "SELL";
    return null;
  }
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
