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

    // Search for users by name or email
    if (action === 'search') {
      const { query } = req.body;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const q = query.toLowerCase().trim();

      // List all user blobs and search through them
      const { blobs } = await list({ prefix: 'users/' });
      const results = [];

      for (const blob of blobs) {
        try {
          const r = await fetch(blob.url);
          if (!r.ok) continue;
          const user = await r.json();
          if (
            user.email === email.toLowerCase().trim() // skip self
          ) continue;

          if (
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q)
          ) {
            const userHash = hashEmail(user.email);
            results.push({
              emailHash: userHash,
              name: user.name,
              email: user.email,
              level: user.level,
              duprRating: user.duprRating || null,
              avatarUrl: user.avatarUrl || null,
            });
          }
        } catch {}
      }

      return res.status(200).json({ results: results.slice(0, 20) });
    }

    // Send a friend request
    if (action === 'send-request') {
      const { targetEmailHash, targetEmail, targetName } = req.body;
      if (!targetEmailHash) {
        return res.status(400).json({ error: 'Target email hash is required' });
      }

      // Get sender's user data for name
      const sender = await getBlob('users', emailHash);
      if (!sender) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      // Check if already friends
      const myFriends = (await getBlob('friends', emailHash)) || [];
      if (myFriends.some(f => f.emailHash === targetEmailHash)) {
        return res.status(409).json({ error: 'Already friends' });
      }

      // Check if request already sent
      const targetRequests = (await getBlob('friend-requests', targetEmailHash)) || [];
      if (targetRequests.some(r => r.fromEmailHash === emailHash)) {
        return res.status(409).json({ error: 'Friend request already sent' });
      }

      // Check if they already sent us a request (auto-accept)
      const myRequests = (await getBlob('friend-requests', emailHash)) || [];
      const incomingFromTarget = myRequests.find(r => r.fromEmailHash === targetEmailHash);
      if (incomingFromTarget) {
        // Auto-accept: add both as friends
        const now = Date.now();
        const myUpdatedFriends = [...myFriends, {
          emailHash: targetEmailHash,
          email: targetEmail,
          name: targetName,
          addedAt: now,
          status: 'accepted',
        }];
        await putBlob('friends', emailHash, myUpdatedFriends);

        const targetFriends = (await getBlob('friends', targetEmailHash)) || [];
        targetFriends.push({
          emailHash: emailHash,
          email: sender.email,
          name: sender.name,
          addedAt: now,
          status: 'accepted',
        });
        await putBlob('friends', targetEmailHash, targetFriends);

        // Remove the incoming request
        const updatedMyRequests = myRequests.filter(r => r.fromEmailHash !== targetEmailHash);
        await putBlob('friend-requests', emailHash, updatedMyRequests);

        return res.status(200).json({ status: 'auto-accepted' });
      }

      // Add request to target's incoming requests
      targetRequests.push({
        fromEmailHash: emailHash,
        fromEmail: sender.email,
        fromName: sender.name,
        sentAt: Date.now(),
      });
      await putBlob('friend-requests', targetEmailHash, targetRequests);

      return res.status(200).json({ status: 'sent' });
    }

    // Respond to a friend request (accept or decline)
    if (action === 'respond-request') {
      const { fromEmailHash, accept } = req.body;
      if (!fromEmailHash) {
        return res.status(400).json({ error: 'fromEmailHash is required' });
      }

      const myRequests = (await getBlob('friend-requests', emailHash)) || [];
      const request = myRequests.find(r => r.fromEmailHash === fromEmailHash);
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      // Remove the request
      const updatedRequests = myRequests.filter(r => r.fromEmailHash !== fromEmailHash);
      await putBlob('friend-requests', emailHash, updatedRequests);

      if (accept) {
        const now = Date.now();

        // Add to my friends
        const myFriends = (await getBlob('friends', emailHash)) || [];
        myFriends.push({
          emailHash: fromEmailHash,
          email: request.fromEmail,
          name: request.fromName,
          addedAt: now,
          status: 'accepted',
        });
        await putBlob('friends', emailHash, myFriends);

        // Add to their friends
        const me = await getBlob('users', emailHash);
        const theirFriends = (await getBlob('friends', fromEmailHash)) || [];
        theirFriends.push({
          emailHash: emailHash,
          email: me?.email || email,
          name: me?.name || 'Unknown',
          addedAt: now,
          status: 'accepted',
        });
        await putBlob('friends', fromEmailHash, theirFriends);
      }

      return res.status(200).json({ status: accept ? 'accepted' : 'declined' });
    }

    // List friends
    if (action === 'list') {
      const friends = (await getBlob('friends', emailHash)) || [];
      return res.status(200).json({ friends });
    }

    // Remove a friend
    if (action === 'remove') {
      const { targetEmailHash } = req.body;
      if (!targetEmailHash) {
        return res.status(400).json({ error: 'targetEmailHash is required' });
      }

      // Remove from my list
      const myFriends = (await getBlob('friends', emailHash)) || [];
      const updated = myFriends.filter(f => f.emailHash !== targetEmailHash);
      await putBlob('friends', emailHash, updated);

      // Remove from their list
      const theirFriends = (await getBlob('friends', targetEmailHash)) || [];
      const theirUpdated = theirFriends.filter(f => f.emailHash !== emailHash);
      await putBlob('friends', targetEmailHash, theirUpdated);

      return res.status(200).json({ status: 'removed' });
    }

    // Get pending friend requests
    if (action === 'pending') {
      const requests = (await getBlob('friend-requests', emailHash)) || [];
      return res.status(200).json({ requests });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Friends API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
