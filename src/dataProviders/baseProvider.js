export class DataProvider {
  async getQuote(symbol) {
    throw new Error("getQuote() must be implemented");
  }

  async getHistorical(symbol, interval = "day", from, to) {
    throw new Error("getHistorical() must be implemented");
  }

  connectStream(symbols, onData) {
    throw new Error("connectStream() must be implemented");
  }
}
