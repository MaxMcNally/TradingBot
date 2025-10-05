export class DataProvider {
  async getQuote(symbol:string) {
  }

  async getHistorical(symbol:string, interval = 'day', from:string, to:string) {
  }

  connectStream(symbols: string[], onData:(data:any)=>void) {
  }
}
