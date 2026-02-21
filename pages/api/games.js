import { put, list } from '@vercel/blob';

// Unambiguous characters (no 0/O, 1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

function blobPath(code) {
  return `games/${code}.json`;
}

async function getGame(code) {
  try {
    const { blobs } = await list({ prefix: blobPath(code) });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getGame error:', e);
    return null;
  }
}

async function putGame(code, data) {
  await put(blobPath(code), JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { code, state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'state is required' });
      }

      let shareCode = code || generateCode();

      await putGame(shareCode, { state, updatedAt: Date.now() });
      return res.status(200).json({ code: shareCode });
    }

    if (req.method === 'GET') {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'code query param is required' });
      }

      const game = await getGame(code);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ state: game.state, updatedAt: game.updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API error:', e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
}
