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

  const room = String(req.query.room || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,48}$/.test(room)) {
    return res.status(400).json({ error: 'Invalid room name' });
  }

  const requestedLimit = Number(req.query.limit || 50);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(200, Math.floor(requestedLimit))) : 50;

  try {
    const upstream = await fetch(`${TECHNCORE_ORIGIN}/r/${encodeURIComponent(room)}?limit=${limit}&format=json`, {
      headers: { Accept: 'application/json, text/plain;q=0.9' },
    });

    const body = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=15');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: 'Unable to reach Technocore', detail: error.message });
  }
}
