/**
 * /api/insights — team-shared override store for the ChiCom dashboard
 * editable comment boxes. Backed by Vercel's native Redis.
 *
 * GET    → { "Q1_1:a": "...", "Q1_1:b": "...", ... } (only keys that have overrides)
 * POST   { id, text }  → saves one override at key `insight:<id>`
 * DELETE { id }        → removes one override
 *
 * No auth for MVP. Gate behind Vercel Deployment Protection for public URLs.
 */

import { createClient } from 'redis';

const ID_RE = /^[A-Za-z0-9_:]{1,64}$/;
const MAX_CHARS = 4000;

function validId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

function kvKey(id) {
  return `insight:${id}`;
}

// Cache the Redis client across invocations within the same warm container.
let _client = null;
async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (_client && _client.isOpen) return _client;
  _client = createClient({ url: process.env.REDIS_URL });
  _client.on('error', (err) => console.error('[redis]', err));
  await _client.connect();
  return _client;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const redis = await getRedis();
  if (!redis) {
    return res.status(503).json({
      error: 'Redis not configured — link a Redis database in Vercel dashboard → Storage tab',
    });
  }

  try {
    if (req.method === 'GET') {
      // Scan all `insight:*` keys and return as a flat map.
      // node-redis v5: cursor is passed and returned as a string; '0' sentinel.
      const keys = [];
      let cursor = '0';
      do {
        const r = await redis.scan(cursor, { MATCH: 'insight:*', COUNT: 200 });
        cursor = String(r.cursor);
        if (r.keys && r.keys.length) keys.push(...r.keys);
      } while (cursor !== '0');

      const out = {};
      if (keys.length) {
        const values = await redis.mGet(keys);
        keys.forEach((key, i) => {
          const id = key.replace(/^insight:/, '');
          const v = values[i];
          if (typeof v === 'string' && v.trim()) out[id] = v;
        });
      }
      return res.status(200).json(out);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
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
        await redis.del(kvKey(id));
        return res.status(200).json({ ok: true, deleted: true });
      }
      await redis.set(kvKey(id), text);
      return res.status(200).json({ ok: true, saved: true });
    }

    if (req.method === 'DELETE') {
      const body = req.body || {};
      const id = body.id || body.qId;
      if (!validId(id)) {
        return res.status(400).json({ error: `invalid id: ${id}` });
      }
      await redis.del(kvKey(id));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[/api/insights] error:', err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}
