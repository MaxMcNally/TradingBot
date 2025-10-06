import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DataProvider } from './baseProvider';

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

export class PolygonFlatFilesProvider extends DataProvider {
  private s3Client: S3Client;
  private bucketName = 'flatfiles';
  private endpoint = 'https://files.polygon.io';

  constructor(config: PolygonFlatFileConfig) {
    super();
    this.s3Client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible endpoints
    });
  }

  async getQuote(symbol: string): Promise<any> {
    // Flat files don't provide real-time quotes, only historical data
    throw new Error('Real-time quotes not available through flat files. Use PolygonProvider for real-time data.');
  }

  async getHistorical(symbol: string, interval: string = 'day', from: string, to: string): Promise<any[]> {
    try {
      // Convert date range to file paths
      const filePaths = this.generateFilePaths(symbol, interval, from, to);
      
      let allData: any[] = [];
      
      for (const filePath of filePaths) {
        try {
          const data = await this.downloadAndParseFile(filePath);
          allData = allData.concat(data);
        } catch (error) {
          console.warn(`Failed to download file ${filePath}:`, error);
          // Continue with other files even if one fails
        }
      }

      // Filter data by date range and sort by date
      const filteredData = this.filterAndSortData(allData, from, to);
      
      return filteredData;
    } catch (error) {
      console.error('Error fetching historical data from flat files:', error);
      return [];
    }
  }

  private generateFilePaths(symbol: string, interval: string, from: string, to: string): string[] {
    const filePaths: string[] = [];
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    // Generate file paths for each month in the date range
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Start of month
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      // Polygon flat files are organized by asset class and data type
      // For stocks, the path structure is typically: stocks/aggregates/{interval}/{year}/{month}/
      const filePath = `stocks/aggregates/${interval}/${year}/${month}/${symbol.toUpperCase()}.csv`;
      filePaths.push(filePath);
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return filePaths;
  }

  private async downloadAndParseFile(filePath: string): Promise<any[]> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      // Convert stream to string
      const csvData = await response.Body.transformToString();
      
      // Parse CSV data
      return this.parseCSVData(csvData);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        // File doesn't exist, which is normal for some date ranges
        return [];
      }
      throw error;
    }
  }

  private parseCSVData(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index].trim();
        
        switch (header) {
          case 'ticker':
            row.ticker = value;
            break;
          case 'volume':
          case 'transactions':
            row[header] = parseInt(value) || 0;
            break;
          case 'open':
          case 'close':
          case 'high':
          case 'low':
            row[header] = parseFloat(value) || 0;
            break;
          case 'window_start':
            // Convert nanosecond timestamp to date
            const timestamp = parseInt(value) / 1000000; // Convert to milliseconds
            row.date = new Date(timestamp).toISOString().split('T')[0];
            break;
        }
      });
      
      data.push(row);
    }
    
    return data;
  }

  private filterAndSortData(data: any[], from: string, to: string): any[] {
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    return data
      .filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        date: item.date,
        close: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume
      }));
  }

  async listAvailableFiles(symbol: string, interval: string = 'day'): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `stocks/aggregates/${interval}/`,
        Delimiter: '/',
      });

      const response = await this.s3Client.send(command);
      return response.Contents?.map(obj => obj.Key || '') || [];
    } catch (error) {
      console.error('Error listing available files:', error);
      return [];
    }
  }

  connectStream(symbols: string[], onData: (data: any) => void): Promise<any> {
    // Flat files don't support real-time streaming
    throw new Error('Real-time streaming not available through flat files. Use PolygonProvider for real-time data.');
  }
}
