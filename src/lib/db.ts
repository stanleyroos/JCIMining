import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

// Module-level singleton pool — reused across hot-reload in dev
const globalForMssql = globalThis as unknown as {
  mssqlPool: sql.ConnectionPool | undefined;
};

async function getPool(): Promise<sql.ConnectionPool> {
  if (!globalForMssql.mssqlPool) {
    globalForMssql.mssqlPool = await new sql.ConnectionPool(config).connect();
    globalForMssql.mssqlPool.on('error', (err) => {
      console.error('SQL pool error', err);
      globalForMssql.mssqlPool = undefined;
    });
  }
  return globalForMssql.mssqlPool;
}

// All parameters are plain primitives — mssql infers the SQL type from the JS value.
// Using the 2-arg form avoids webpack module-identity issues with explicit type references.
export type QueryParam = string | number | boolean | Date | null | undefined;

function bindParams(request: sql.Request, params: Record<string, QueryParam>) {
  for (const [key, value] of Object.entries(params)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).input(key, value === undefined ? null : value);
  }
}

export async function query<T = Record<string, unknown>[]>(
  text: string,
  params?: Record<string, QueryParam>
): Promise<T> {
  const pool = await getPool();
  const request = pool.request();
  if (params) bindParams(request, params);
  const result = await request.query(text);
  return result.recordset as unknown as T;
}

export async function execute(
  text: string,
  params?: Record<string, QueryParam>
): Promise<sql.IResult<unknown>> {
  const pool = await getPool();
  const request = pool.request();
  if (params) bindParams(request, params);
  return request.query(text);
}

export { sql };
