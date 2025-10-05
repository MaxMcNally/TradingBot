import fetch from "node-fetch";

export interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchYahooData(symbol: string, start: string, end: string): Promise<OHLC[]> {
  const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${new Date(start).getTime() / 1000}&period2=${new Date(end).getTime() / 1000}&interval=1d&events=history`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

  const csv = await response.text();
  const lines = csv.split("\n").slice(1);

  return lines
    .filter((line: string) => line.trim())
    .map(line => {
      const [date, open, high, low, close, , volume] = line.split(",");
      return {
        date,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseInt(volume),
      };
    });
}
