import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });

async function main() {
  const url = process.env.REP_TRACK_DATA_API_URL;
  const secret = process.env.REP_TRACK_DATA_API_SECRET;
  console.log('Worker URL:', url);

  const res = await fetch(`${url}/api/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: 'SELECT count(*) as count FROM users',
      params: [],
      method: 'all',
    }),
  });
  console.log('Query status:', res.status);
  const data = await res.json();
  console.log('Query data:', data);

  const batchRes = await fetch(`${url}/api/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statements: [
        { sql: 'SELECT count(*) as count FROM users', params: [], method: 'all' }
      ],
    }),
  });
  console.log('Batch status:', batchRes.status);
  const batchData = await batchRes.json();
  console.log('Batch data:', batchData);
}

main().catch(console.error);
