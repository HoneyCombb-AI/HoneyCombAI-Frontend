import { Pool, QueryConfig, QueryResult, QueryResultRow } from 'pg';

// Only create the pool once, using the secure environment variable
const pool = new Pool({
  connectionString: process.env.NEXT_PUBLIC_SUPEBASE_TRAN_POOLER_URL,
  // Add SSL settings for production environments
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL/Vercel
  },
});

/**
 * Execute a raw SQL query.
 * @param {string} text The SQL query string.
 * @param {Array} params Parameters to safely inject into the query.
 * @returns {Promise<import('pg').QueryResult>} The result of the query.
 */
export async function sql<T extends QueryResultRow = QueryResultRow>(
  query: string | QueryConfig<any[]>,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const start = Date.now();
  
  // Use the pool to get a client connection
  const client = await pool.connect();
  
  try {
    const result = typeof query === 'string'
      ? await client.query<T>(query, params)
      : await client.query<T>(query);
    const duration = Date.now() - start;
    const text = typeof query === 'string' ? query : query.text;
    console.log('Executed query:', { text, duration, rows: result.rowCount });
    return result;
  } catch (err) {
    console.error('Database Query Error:', err);
    throw err;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}
