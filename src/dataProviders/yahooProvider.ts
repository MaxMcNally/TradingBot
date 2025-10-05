import { DataProvider } from './baseProvider.js';
const BASE_URL = "https://query1.finance.yahoo.com/v7/finance/download/";
export class YahooDataProvider {
    constructor(){

    }
    getQuote(_symbol:string){
        return Promise.resolve()
    }
    async getHistorical(symbol:string, interval = '1day', from:string, to:string){
        const url = `${BASE_URL}${symbol}?period1=${new Date(from).getTime() / 1000}&period2=${new Date(to).getTime() / 1000}&interval=${interval}&events=history`;
        try {
            const response = await fetch(url);
            return Promise.resolve(response);
        }
        catch(e){
            return Promise.reject(e);
        }
        
    }
    connectStream(symbols: string[], onData:(data:any)=>void) {
        return Promise.resolve();
    }
}