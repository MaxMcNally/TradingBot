import { spawn } from 'child_process';
import { DataProvider } from './baseProvider';
import { parse } from 'csv-parse/sync';

export interface PolygonFlatFileConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface FlatFileData {
  ticker: string;
  volume: number;
  open: number;
  close: number;
  high: number;
  low: number;
  window_start: string;
  transactions: number;
}

export class PolygonFlatFilesCLIProvider extends DataProvider {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private bucketName = 'flatfiles';
  private endpoint = 'https://files.polygon.io';

  constructor(config: PolygonFlatFileConfig) {
    super();
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.region = config.region || 'us-east-1';
  }

  async getQuote(symbol: string): Promise<any> {
    // Flat files don't provide real-time quotes, only historical data
    throw new Error('Real-time quotes not available through flat files. Use PolygonProvider for real-time data.');
  }

  async getHistorical(symbol: string, interval: string = 'day', from: string, to: string): Promise<any[]> {
    if (interval !== 'day') {
      console.warn("PolygonFlatFilesCLIProvider currently only supports 'day' interval. Falling back to 'day'.");
      interval = 'day';
    }

    const startDate = new Date(from);
    const endDate = new Date(to);
    let allData: any[] = [];

    // Iterate through each day in the date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (d.getDay() === 0 || d.getDay() === 6) {
        continue;
      }

      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const key = `us_stocks_sip/day_aggs_v1/${year}/${month}/${year}-${month}-${day}.csv.gz`;

      try {
        const csvData = await this.downloadFileFromS3(key);
        if (csvData) {
          const parsedDayData = this.parseCSVData(csvData, symbol.toUpperCase());
          allData = allData.concat(parsedDayData);
        }
      } catch (error: any) {
        if (error.message.includes('NoSuchKey') || error.message.includes('does not exist')) {
          // File doesn't exist, which is normal for some dates (holidays, etc.)
          console.warn(`No flat file found for ${key}`);
        } else {
          console.error(`Failed to download file ${key}: ${error.message}`);
        }
      }
    }

    // Sort data by date
    return allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private async downloadFileFromS3(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // Use AWS CLI to download the file and pipe through gunzip
      const awsCommand = spawn('aws', [
        's3',
        'cp',
        `s3://${this.bucketName}/${key}`,
        '-',
        '--endpoint-url', this.endpoint,
        '--region', this.region
      ], {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID: this.accessKeyId,
          AWS_SECRET_ACCESS_KEY: this.secretAccessKey,
          AWS_DEFAULT_REGION: this.region
        }
      });

      const gunzipCommand = spawn('gunzip', ['-c']);

      let stdout = '';
      let stderr = '';

      // Pipe AWS CLI output to gunzip
      awsCommand.stdout.pipe(gunzipCommand.stdin);

      gunzipCommand.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      awsCommand.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gunzipCommand.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gunzipCommand.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Gunzip error (${code}): ${stderr}`));
        }
      });

      awsCommand.on('close', (code) => {
        if (code !== 0) {
          if (stderr.includes('NoSuchKey') || stderr.includes('does not exist')) {
            resolve(null); // File doesn't exist
          } else {
            reject(new Error(`AWS CLI error (${code}): ${stderr}`));
          }
        }
      });

      awsCommand.on('error', (error) => {
        reject(new Error(`Failed to spawn AWS CLI: ${error.message}`));
      });

      gunzipCommand.on('error', (error) => {
        reject(new Error(`Failed to spawn gunzip: ${error.message}`));
      });
    });
  }

  private parseCSVData(csvData: string, symbol: string): any[] {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      // Filter for the specific symbol
      const symbolRecords = records.filter((record: any) => record.ticker === symbol);

      return symbolRecords.map((record: any) => ({
        date: this.convertTimestampToDate(record.window_start),
        close: parseFloat(record.close),
        open: parseFloat(record.open),
        high: parseFloat(record.high),
        low: parseFloat(record.low),
        volume: parseInt(record.volume)
      }));
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      return [];
    }
  }

  private convertTimestampToDate(timestamp: string): string {
    // Convert nanosecond timestamp to date string
    // Polygon uses nanosecond timestamps, so we need to divide by 1,000,000,000
    const nanoseconds = parseInt(timestamp);
    const milliseconds = nanoseconds / 1000000; // Convert to milliseconds
    const date = new Date(milliseconds);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }
}
