/**
 * /api/insights — team-shared override store for the ChiCom dashboard
 * AI-insight paragraphs. Backed by Vercel KV.
 *
 * GET    → { Q1: "...", Q2: "...", ... } (only keys that have overrides)
 * POST   { qId, text }  → saves one override
 * DELETE { qId }        → removes one override (dashboard falls back to baked-in)
 *
 * No auth for MVP. Recommend gating behind Vercel Deployment Protection
 * or add a shared-secret header before shipping to a public URL.
 */

import { kv } from '@vercel/kv';

// Accept both legacy Q-level ids (Q1..Q14) and per-chart ids like
// "Q1_1:a" (chartId:slot). Pattern caps length and restricts charset.
const ID_RE = /^[A-Za-z0-9_:]{1,64}$/;
const VALID_LEGACY = new Set([
  'Q1', 'Q2', 'Q3', 'Q4', 'Q5',
  'Q7', 'Q8', 'Q9', 'Q10',
  'Q11', 'Q12', 'Q13', 'Q14',
]);
const MAX_CHARS = 4000;

function validId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

function kvKey(id) {
  return `insight:${id}`;
}

export default async function handler(req, res) {
  // Never let the CDN cache this endpoint
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      // Scan all insight:* keys in KV and return as a flat map.
      const out = {};
      let cursor = 0;
      do {
        const [next, batch] = await kv.scan(cursor, { match: 'insight:*', count: 200 });
        cursor = Number(next);
        if (batch.length) {
          const values = await kv.mget(...batch);
          batch.forEach((key, i) => {
            const id = key.replace(/^insight:/, '');
            const v = values[i];
            if (typeof v === 'string' && v.trim()) out[id] = v;
          });
        }
      } while (cursor !== 0);
      return res.status(200).json(out);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      // Accept either { id, text } (new per-chart) or { qId, text } (legacy)
      const id = body.id || body.qId;
      const { text } = body;
      if (!validId(id)) {
        return res.status(400).json({ error: `invalid id: ${id}` });
      }
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'text must be a string' });
      }
      if (text.length > MAX_CHARS) {
        return res.status(413).json({ error: `text exceeds ${MAX_CHARS} chars` });
      }
      if (!text.trim()) {
        await kv.del(kvKey(id));
        return res.status(200).json({ ok: true, deleted: true });
      }
      await kv.set(kvKey(id), text);
      return res.status(200).json({ ok: true, saved: true });
    }

    if (req.method === 'DELETE') {
      const body = req.body || {};
      const id = body.id || body.qId;
      if (!validId(id)) {
        return res.status(400).json({ error: `invalid id: ${id}` });
      }
      await kv.del(kvKey(id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[/api/insights] error:', err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}
