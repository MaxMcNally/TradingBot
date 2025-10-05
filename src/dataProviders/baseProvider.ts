export class DataProvider {
  async getQuote(symbol:string): Promise<any> {
    return null;
  }

  async getHistorical(symbol:string, interval = 'day', from:string, to:string): Promise<any[]> {
    return [];
  }

  connectStream(symbols: string[], onData:(data:any)=>void): Promise<any> {
    return Promise.resolve();
  }
}
