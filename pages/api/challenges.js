import { put, list } from '@vercel/blob';
import crypto from 'crypto';

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function blobPath(type, key) {
  return `${type}/${key}.json`;
}

async function getBlob(type, key) {
  try {
    const { blobs } = await list({ prefix: blobPath(type, key) });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`getBlob(${type}, ${key}) error:`, e);
    return null;
  }
}

async function putBlob(type, key, data) {
  await put(blobPath(type, key), JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailHash = hashEmail(email);

    // Create a challenge
    if (action === 'create') {
      const { targets, settings } = req.body;
      // Support legacy single-target format
      const { targetEmailHash, targetEmail, targetName } = req.body;

      const playerTargets = targets || (targetEmailHash ? [{ emailHash: targetEmailHash, email: targetEmail, name: targetName }] : null);

      if (!playerTargets || playerTargets.length === 0) {
        return res.status(400).json({ error: 'At least one target is required' });
      }

      if (playerTargets.length !== 1 && playerTargets.length !== 3) {
        return res.status(400).json({ error: 'Must challenge 1 or 3 friends (2 or 4 player game)' });
      }

      const sender = await getBlob('users', emailHash);
      if (!sender) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      const challengeId = crypto.randomUUID();
      const gameType = playerTargets.length === 1 ? '1v1' : '2v2';
      const challenge = {
        id: challengeId,
        fromEmailHash: emailHash,
        fromEmail: sender.email,
        fromName: sender.name,
        // Keep first target in legacy fields for backwards compat
        toEmailHash: playerTargets[0].emailHash,
        toEmail: playerTargets[0].email,
        toName: playerTargets[0].name,
        // All targets array
        targets: playerTargets,
        gameType,
        settings: {
          pointsToWin: (settings && settings.pointsToWin) || 11,
          winByTwo: settings ? settings.winByTwo : true,
        },
        status: 'pending',
        createdAt: Date.now(),
      };

      // Save challenge
      await putBlob('challenges', challengeId, challenge);

      // Add to sender's challenge index
      const myIndex = (await getBlob('user-challenges', emailHash)) || [];
      myIndex.unshift(challengeId);
      await putBlob('user-challenges', emailHash, myIndex);

      // Add to all targets' challenge indexes
      for (const target of playerTargets) {
        const targetIndex = (await getBlob('user-challenges', target.emailHash)) || [];
        targetIndex.unshift(challengeId);
        await putBlob('user-challenges', target.emailHash, targetIndex);
      }

      return res.status(200).json({ challenge });
    }

    // Respond to a challenge
    if (action === 'respond') {
      const { challengeId, accept } = req.body;
      if (!challengeId) {
        return res.status(400).json({ error: 'challengeId is required' });
      }

      const challenge = await getBlob('challenges', challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      // Check if user is one of the targets
      const isTarget = challenge.targets
        ? challenge.targets.some(t => t.emailHash === emailHash)
        : challenge.toEmailHash === emailHash;
      if (!isTarget) {
        return res.status(403).json({ error: 'Not authorized to respond to this challenge' });
      }

      challenge.status = accept ? 'accepted' : 'declined';
      challenge.respondedAt = Date.now();
      await putBlob('challenges', challengeId, challenge);

      return res.status(200).json({ challenge });
    }

    // List user's challenges
    if (action === 'list') {
      const index = (await getBlob('user-challenges', emailHash)) || [];
      const challenges = [];

      for (const id of index.slice(0, 20)) {
        const challenge = await getBlob('challenges', id);
        if (challenge) challenges.push(challenge);
      }

      return res.status(200).json({ challenges });
    }

    // Get a specific challenge
    if (action === 'get') {
      const { challengeId } = req.body;
      if (!challengeId) {
        return res.status(400).json({ error: 'challengeId is required' });
      }

      const challenge = await getBlob('challenges', challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      return res.status(200).json({ challenge });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Challenges API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
