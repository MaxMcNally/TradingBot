import yahooFinance from "yahoo-finance2";
const BASE_URL = "https://query1.finance.yahoo.com/v7/finance/download/";

export class YahooDataProvider {
    constructor(){

    }
    async getQuote(_symbol:string){
        const quote = await yahooFinance.quote('AAPL');
        return quote
    }
    async getHistorical(symbol:string, from:string, to:string, interval = "1d" ){
        const url = `${BASE_URL}${symbol}?period1=${new Date(from).getTime() / 1000}&period2=${new Date(to).getTime() / 1000}&interval=${interval}&events=history`;
        try {
            const response = await yahooFinance.historical(symbol,{
                period1: from,
                period2: to
            });
            return response;
        }
        
        catch(e){
            console.error(e);
            return;
        }
        
    }
    connectStream(symbols: string[], onData:(data:any)=>void) {
        return Promise.resolve();
    }
}