const TECHNCORE_ORIGIN = 'https://technocore.chat';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
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
