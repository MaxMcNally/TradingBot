import { db } from '../initDb';

export interface ApiUsageLogData {
  id?: number;
  api_key_id: number;
  user_id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number | null;
  request_size?: number | null;
  response_size?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  error_message?: string | null;
  created_at?: string;
}

export interface CreateApiUsageLogData {
  api_key_id: number;
  user_id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  request_size?: number;
  response_size?: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
}

export class ApiUsageLog {
  static async create(logData: CreateApiUsageLogData): Promise<ApiUsageLogData> {
    return new Promise((resolve, reject) => {
      const {
        api_key_id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        request_size,
        response_size,
        ip_address,
        user_agent,
        error_message
      } = logData;

      const query = `
        INSERT INTO api_usage_logs (
          api_key_id, user_id, endpoint, method, status_code,
          response_time_ms, request_size, response_size, ip_address, user_agent, error_message,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id
      `;

      db.run(
        query,
        [
          api_key_id,
          user_id,
          endpoint,
          method,
          status_code,
          response_time_ms || null,
          request_size || null,
          response_size || null,
          ip_address || null,
          user_agent || null,
          error_message || null
        ],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            db.get(
              'SELECT * FROM api_usage_logs WHERE id = $1',
              [this.lastID],
              (fetchErr: any, row: any) => {
                if (fetchErr) {
                  reject(fetchErr);
                } else {
                  resolve(row);
                }
              }
            );
          }
        }
      );
    });
  }

  static async findByUserId(userId: number, limit: number = 100): Promise<ApiUsageLogData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM api_usage_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async findByApiKeyId(apiKeyId: number, limit: number = 100): Promise<ApiUsageLogData[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM api_usage_logs WHERE api_key_id = $1 ORDER BY created_at DESC LIMIT $2',
        [apiKeyId, limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async getStatsByUserId(userId: number, days: number = 30): Promise<{
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
    total_requests_today: number;
    endpoints: Array<{ endpoint: string; count: number }>;
  }> {
    return new Promise((resolve, reject) => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      const sinceDateStr = sinceDate.toISOString();

      db.all(
        `SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
          AVG(response_time_ms) as avg_response_time,
          SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as total_requests_today
        FROM api_usage_logs 
        WHERE user_id = $1 AND created_at >= $2`,
        [userId, sinceDateStr],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const stats = rows[0] || {
              total_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              avg_response_time: 0,
              total_requests_today: 0
            };

            // Get endpoint breakdown
            db.all(
              `SELECT endpoint, COUNT(*) as count
               FROM api_usage_logs
               WHERE user_id = $1 AND created_at >= $2
               GROUP BY endpoint
               ORDER BY count DESC
               LIMIT 10`,
              [userId, sinceDateStr],
              (endpointErr: any, endpointRows: any[]) => {
                if (endpointErr) {
                  reject(endpointErr);
                } else {
                  resolve({
                    total_requests: parseInt(stats.total_requests) || 0,
                    successful_requests: parseInt(stats.successful_requests) || 0,
                    failed_requests: parseInt(stats.failed_requests) || 0,
                    avg_response_time: parseFloat(stats.avg_response_time) || 0,
                    total_requests_today: parseInt(stats.total_requests_today) || 0,
                    endpoints: (endpointRows || []).map(row => ({
                      endpoint: row.endpoint,
                      count: parseInt(row.count)
                    }))
                  });
                }
              }
            );
          }
        }
      );
    });
  }
}

export default ApiUsageLog;

