import yahooFinance from "yahoo-finance2";
import { DataProvider, NewsArticle } from "./baseProvider";
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
    async getNews(symbol: string, options: { startDate?: string; endDate?: string; limit?: number } = {}): Promise<NewsArticle[]> {
        try {
            // Yahoo Finance v2: use quoteSummary with 'news' module
            const result: any = await (yahooFinance as any).quoteSummary(symbol, { modules: ['news'] });
            const items: any[] = result?.news?.news || result?.news || [];

            const mapItem = (item: any): NewsArticle => {
                const publishTime = item.providerPublishTime
                    ? new Date(item.providerPublishTime * 1000)
                    : (item.pubDate ? new Date(item.pubDate) : new Date());
                return {
                    id: item.uuid || item.id,
                    ticker: symbol.toUpperCase(),
                    title: item.title || item.headline,
                    description: item.summary || item.excerpt || undefined,
                    url: item.link || item.url,
                    source: item.publisher || item.provider || item.source || undefined,
                    publishedAt: publishTime.toISOString(),
                };
            };

            let articles = items.map(mapItem);

            // Optional filtering by date
            if (options.startDate) {
                const start = new Date(options.startDate).getTime();
                articles = articles.filter(a => new Date(a.publishedAt).getTime() >= start);
            }
            if (options.endDate) {
                const end = new Date(options.endDate).getTime();
                articles = articles.filter(a => new Date(a.publishedAt).getTime() <= end);
            }
            if (options.limit && options.limit > 0) {
                articles = articles.slice(0, options.limit);
            }
            return articles;
        } catch (error) {
            console.error('Error fetching news from Yahoo:', error);
            return [];
        }
    }
    connectStream(symbols: string[], onData:(data:any)=>void) {
        return Promise.resolve();
    }
}