// In-memory game state store
const games = new Map();

// Unambiguous characters (no 0/O, 1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// Clean up games older than 24 hours
function cleanup() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  for (const [code, game] of games) {
    if (now - game.updatedAt > DAY) {
      games.delete(code);
    }
  }
}

export default function handler(req, res) {
  cleanup();

  if (req.method === 'POST') {
    const { code, state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'state is required' });
    }

    let shareCode = code;
    if (!shareCode || !games.has(shareCode)) {
      // Generate a unique code
      do {
        shareCode = generateCode();
      } while (games.has(shareCode));
    }

    games.set(shareCode, { state, updatedAt: Date.now() });
    return res.status(200).json({ code: shareCode });
  }

  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'code query param is required' });
    }

    const game = games.get(code);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.status(200).json({ state: game.state, updatedAt: game.updatedAt });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
