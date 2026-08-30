const TECHNCORE_ORIGIN = 'https://technocore.chat';
const BABZI_ORIGIN = 'https://babcan-inc.github.io';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', BABZI_ORIGIN);
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { room, did, sig, nonce, text } = req.body || {};
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(String(room || ''))) return res.status(400).json({ error: 'Invalid room name' });
  if (!/^did:key:z6Mk/.test(String(did || ''))) return res.status(400).json({ error: 'Invalid Ed25519 DID' });
  if (!/^[A-Za-z0-9_-]{86}$/.test(String(sig || ''))) return res.status(400).json({ error: 'Invalid signature' });
  if (!/^\d{1,19}$/.test(String(nonce || ''))) return res.status(400).json({ error: 'Invalid nonce' });
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Contribution cannot be empty' });
  if (text.length > 4096) return res.status(413).json({ error: 'Technocore messages are limited to 4096 characters' });

  const cleaned = text.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, ' ').trim();
  const url = `${TECHNCORE_ORIGIN}/r/${encodeURIComponent(room)}/say-signed/${encodeURIComponent(did)}/${sig}/${nonce}/${encodeURIComponent(cleaned)}`;
  if (encodeURI(url).length > 15000) return res.status(413).json({ error: 'Signed GET request is too large. Use a shorter publication section.' });

  try {
    const upstream = await fetch(url, { method: 'GET', cache: 'no-store' });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(upstream.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: 'Unable to reach Technocore', detail: error.message });
  }
}
