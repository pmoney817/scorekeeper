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

    // Create a tournament invite
    if (action === 'create') {
      const { targetEmailHash, targetEmail, targetName, tournamentName, shareCode } = req.body;
      if (!targetEmailHash) {
        return res.status(400).json({ error: 'Target is required' });
      }

      const sender = await getBlob('users', emailHash);
      if (!sender) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      const inviteId = crypto.randomUUID();
      const invite = {
        id: inviteId,
        fromEmailHash: emailHash,
        fromEmail: sender.email,
        fromName: sender.name,
        toEmailHash: targetEmailHash,
        toEmail: targetEmail,
        toName: targetName,
        tournamentName: tournamentName || 'Untitled Game',
        shareCode: shareCode || null,
        status: 'pending',
        createdAt: Date.now(),
      };

      await putBlob('tournament-invites', inviteId, invite);

      // Add invite to target's invite index
      const targetInvites = (await getBlob('user-invites', targetEmailHash)) || [];
      targetInvites.unshift(inviteId);
      await putBlob('user-invites', targetEmailHash, targetInvites);

      // Also add to sender's index
      const myInvites = (await getBlob('user-invites', emailHash)) || [];
      myInvites.unshift(inviteId);
      await putBlob('user-invites', emailHash, myInvites);

      return res.status(200).json({ invite });
    }

    // Respond to an invite
    if (action === 'respond') {
      const { inviteId, accept } = req.body;
      if (!inviteId) {
        return res.status(400).json({ error: 'inviteId is required' });
      }

      const invite = await getBlob('tournament-invites', inviteId);
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.toEmailHash !== emailHash) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      invite.status = accept ? 'accepted' : 'declined';
      invite.respondedAt = Date.now();
      await putBlob('tournament-invites', inviteId, invite);

      return res.status(200).json({ invite });
    }

    // List user's invites
    if (action === 'list') {
      const index = (await getBlob('user-invites', emailHash)) || [];
      const invites = [];

      for (const id of index.slice(0, 20)) {
        const invite = await getBlob('tournament-invites', id);
        if (invite) invites.push(invite);
      }

      return res.status(200).json({ invites });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Tournament invites API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
