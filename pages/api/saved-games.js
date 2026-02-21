import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function getBlob(prefix) {
  try {
    const { blobs } = await list({ prefix });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`getBlob(${prefix}) error:`, e);
    return null;
  }
}

async function putBlob(path, data) {
  await put(path, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

const MAX_SAVED_GAMES = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    // Save a game for all participants who have accounts
    if (action === 'save') {
      const { email, game, participantNames } = req.body;
      if (!email || !game) {
        return res.status(400).json({ error: 'Email and game are required' });
      }

      const gameId = game.id || Date.now().toString();
      const gameData = { ...game, id: gameId, savedAt: Date.now() };

      // Store the game data blob
      await putBlob(`saved-games-data/${gameId}.json`, gameData);

      // Build list of emailHashes to save for: current user + matched participants
      const emailHashesMap = new Map();
      const callerHash = hashEmail(email);
      emailHashesMap.set(callerHash, true);

      // Search for participant accounts by name
      if (participantNames && participantNames.length > 0) {
        try {
          const { blobs: userBlobs } = await list({ prefix: 'users/' });
          for (const blob of userBlobs) {
            try {
              const userRes = await fetch(blob.url);
              if (!userRes.ok) continue;
              const userData = await userRes.json();
              if (userData.name && participantNames.some(
                pName => pName.toLowerCase().trim() === userData.name.toLowerCase().trim()
              )) {
                const h = hashEmail(userData.email);
                emailHashesMap.set(h, true);
              }
            } catch {}
          }
        } catch {}
      }

      // Add gameId to each matched user's saved-games index
      for (const eHash of emailHashesMap.keys()) {
        const index = (await getBlob(`saved-games/${eHash}.json`)) || [];
        // Avoid duplicates (same game id)
        const filtered = index.filter(entry => entry.gameId !== gameId);
        filtered.unshift({ gameId, name: gameData.name, date: gameData.date, type: gameData.type, savedAt: gameData.savedAt });
        if (filtered.length > MAX_SAVED_GAMES) filtered.length = MAX_SAVED_GAMES;
        await putBlob(`saved-games/${eHash}.json`, filtered);
      }

      return res.status(200).json({ gameId, savedFor: emailHashesMap.size });
    }

    // List saved games for a user
    if (action === 'list') {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailHash = hashEmail(email);
      const index = (await getBlob(`saved-games/${emailHash}.json`)) || [];

      // Fetch full game data for each entry
      const games = [];
      for (const entry of index) {
        const gameData = await getBlob(`saved-games-data/${entry.gameId}.json`);
        if (gameData) {
          games.push(gameData);
        }
      }

      return res.status(200).json({ games });
    }

    // Delete a saved game from a user's list
    if (action === 'delete') {
      const { email, gameId } = req.body;
      if (!email || !gameId) {
        return res.status(400).json({ error: 'Email and gameId are required' });
      }

      const emailHash = hashEmail(email);
      const index = (await getBlob(`saved-games/${emailHash}.json`)) || [];
      const updated = index.filter(entry => entry.gameId !== gameId.toString());
      await putBlob(`saved-games/${emailHash}.json`, updated);

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Saved games API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
