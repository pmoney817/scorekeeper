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
    const { action } = req.body;

    // Get public profile + stats
    if (action === 'get') {
      const { emailHash } = req.body;
      if (!emailHash) {
        return res.status(400).json({ error: 'emailHash is required' });
      }

      const user = await getBlob('users', emailHash);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get profile extras (bio, visibility)
      const extras = (await getBlob('profiles', emailHash)) || {};

      const profile = {
        name: user.name,
        email: user.email,
        level: user.level,
        yearsPlaying: user.yearsPlaying,
        timesPerWeek: user.timesPerWeek,
        createdAt: user.createdAt,
        duprRating: user.duprRating || null,
        bio: extras.bio || '',
        visibility: extras.visibility || 'friends',
      };

      return res.status(200).json({ profile });
    }

    // Update profile (bio, visibility)
    if (action === 'update') {
      const { email, bio, visibility } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailHash = hashEmail(email);
      const existing = (await getBlob('profiles', emailHash)) || {};

      const updated = {
        ...existing,
        ...(bio !== undefined && { bio: bio.slice(0, 500) }),
        ...(visibility !== undefined && { visibility }),
        updatedAt: Date.now(),
      };

      await putBlob('profiles', emailHash, updated);
      return res.status(200).json({ profile: updated });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Profile API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
