import https from 'https';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import csvParser from 'csv-parser';
import zlib from 'zlib';
import stream from 'stream';
import { promisify } from 'util';

const agent = new https.Agent({
  rejectUnauthorized: false, // allow self-signed certs
});
const pipeline = promisify(stream.pipeline);

export interface S3Object {
  Key?: string;
  LastModified?: Date;
  ETag?: string;
  Size?: number;
  StorageClass?: string;
}

export interface TradeRecord {
  [key: string]: string | number;
}

export interface PolygonS3ProviderConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export class PolygonS3Provider {
  private bucket: string;
  private s3: S3Client;

  constructor({ accessKeyId, secretAccessKey, region = 'us-west-1' }: PolygonS3ProviderConfig) {
    this.bucket = 'flatfiles';

    // S3 client with custom https.Agent to ignore self-signed cert (dev only)
    this.s3 = new S3Client({
      region,
      endpoint: 'https://files.polygon.io',
      useGlobalEndpoint: true,
      credentials: { accessKeyId, secretAccessKey },
      requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
    });
  }

  async listFiles(prefix: string): Promise<S3Object[]> {
    const command = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix });
    try {
      console.log(command);
      const response = await this.s3.send(command);
      console.log('Response to list');
      console.log(response);
      return response.Contents || [];
    } catch (err) {
      console.log(err);
      console.error((err as any).$response);
      console.error((err as any).$response?.body.toString());
      return [];
    }
  }

  async fetchCSVGz(key: string): Promise<TradeRecord[]> {
    console.log('Fetching');
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    console.log(command);
    const results: TradeRecord[] = [];
    try {
      const response = await this.s3.send(command);
      console.log(response);
      await pipeline(
        response.Body as NodeJS.ReadableStream,
        zlib.createGunzip(),
        csvParser(),
        new stream.Writable({
          objectMode: true,
          write(chunk: TradeRecord, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
            results.push(chunk);
            callback();
          },
        }),
      );
    } catch (e) {
      console.log('err');
      console.error((e as any).$response);
      return [];
    }
    return results;
  }

  async getTrades(year: string, month: string, day: string): Promise<TradeRecord[]> {
    const key = `us_stocks_sip/trades_v1/${year}/${month}/${year}-${month}-${day}.csv.gz`;
    console.log(key);
    return await this.fetchCSVGz(key);
  }
}
