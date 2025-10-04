import https from 'https';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import csvParser from 'csv-parser';
import zlib from 'zlib';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

export class PolygonS3Provider {
  constructor({ accessKeyId, secretAccessKey, region = 'us-west-1' }) {
    this.bucket = 'flatfiles';

    // S3 client with custom https.Agent to ignore self-signed cert (dev only)
    this.s3 = new S3Client({
      region,
      endpoint: 'https://files.polygon.io',
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async listFiles(prefix) {
    const command = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix });
    try {
      console.log(command);
      const response = await this.s3.send(command);
      console.log('Response to list');
      console.log(reponse);
      return response.Contents || [];
    } catch (err) {
      console.error(err.$response);
      console.error(err.$response?.body.toString());
    }
  }

  async fetchCSVGz(key) {
    console.log('Fetching');
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    console.log(command);
    const results = [];
    try {
      const response = await this.s3.send(command);
      console.log(response);
      await pipeline(
        response.Body,
        zlib.createGunzip(),
        csvParser(),
        new stream.Writable({
          objectMode: true,
          write(chunk, encoding, callback) {
            results.push(chunk);
            callback();
          },
        }),
      );
    } catch (e) {
      console.log('err');
      return console.error(e.$response);
    }
    return results;
  }

  async getTrades(year, month, day) {
    const key = `us_stocks_sip/trades_v1/${year}/${month}/${year}-${month}-${day}.csv.gz`;
    console.log(key);
    return await this.fetchCSVGz(key);
  }
}
