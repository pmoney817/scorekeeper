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
      const { targetEmailHash, targetEmail, targetName, settings } = req.body;
      if (!targetEmailHash) {
        return res.status(400).json({ error: 'Target is required' });
      }

      const sender = await getBlob('users', emailHash);
      if (!sender) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      const challengeId = crypto.randomUUID();
      const challenge = {
        id: challengeId,
        fromEmailHash: emailHash,
        fromEmail: sender.email,
        fromName: sender.name,
        toEmailHash: targetEmailHash,
        toEmail: targetEmail,
        toName: targetName,
        settings: settings || {
          tournamentType: 'roundrobin',
          participantType: 'individual',
          pointsToWin: 11,
          winByTwo: true,
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

      // Add to target's challenge index
      const targetIndex = (await getBlob('user-challenges', targetEmailHash)) || [];
      targetIndex.unshift(challengeId);
      await putBlob('user-challenges', targetEmailHash, targetIndex);

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

      if (challenge.toEmailHash !== emailHash) {
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
