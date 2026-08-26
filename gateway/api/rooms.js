const TECHNCORE_ORIGIN = 'https://technocore.chat';
const BABZI_ORIGIN = 'https://babcan-inc.github.io';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', BABZI_ORIGIN);
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(`${TECHNCORE_ORIGIN}/rooms`, {
      headers: { Accept: 'application/json' },
    });

    const body = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: 'Unable to reach Technocore', detail: error.message });
  }
}
