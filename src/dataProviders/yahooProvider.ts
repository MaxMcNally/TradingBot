import yahooFinance from "yahoo-finance2";
import { DataProvider } from "./baseProvider";
const BASE_URL = "https://query1.finance.yahoo.com/v7/finance/download/";

export class YahooDataProvider extends DataProvider {
    constructor(){
        super();
    }
    async getQuote(_symbol:string){
        try {
            const quote = await yahooFinance.quote('AAPL');
            return quote;
        } catch (error) {
            console.error('Error fetching quote from Yahoo:', error);
            return null;
        }
    }
    async getHistorical(symbol:string, interval = "1d", from:string, to:string ): Promise<any[]> {
        const url = `${BASE_URL}${symbol}?period1=${new Date(from).getTime() / 1000}&period2=${new Date(to).getTime() / 1000}&interval=${interval}&events=history`;
        try {
            const response = await yahooFinance.historical(symbol,{
                period1: from,
                period2: to
            });
            return response || [];
        }
        
        catch(e){
            console.error(e);
            return [];
        }
        
    }
    connectStream(symbols: string[], onData:(data:any)=>void) {
        return Promise.resolve();
    }
}