const TECHNCORE_ORIGIN = 'https://technocore.chat';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const room = String(req.query.room || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,48}$/.test(room)) {
    return res.status(400).json({ error: 'Invalid room name' });
  }

  try {
    const upstream = await fetch(`${TECHNCORE_ORIGIN}/r/${encodeURIComponent(room)}`, {
      headers: { Accept: 'application/json, text/plain;q=0.9' },
    });

    const body = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: 'Unable to reach Technocore', detail: error.message });
  }
}
