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
        avatarUrl: user.avatarUrl || null,
        bio: extras.bio || '',
        visibility: extras.visibility || 'friends',
      };

      return res.status(200).json({ profile });
    }

    // Update profile (bio, visibility, and user fields)
    if (action === 'update') {
      const { email, bio, visibility, name, duprRating, level, timesPerWeek, yearsPlaying } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailHash = hashEmail(email);

      // Update profile extras (bio, visibility)
      const existing = (await getBlob('profiles', emailHash)) || {};
      const updated = {
        ...existing,
        ...(bio !== undefined && { bio: bio.slice(0, 500) }),
        ...(visibility !== undefined && { visibility }),
        updatedAt: Date.now(),
      };
      await putBlob('profiles', emailHash, updated);

      // Update user fields if any provided
      const userFields = { name, duprRating, level, timesPerWeek, yearsPlaying };
      const hasUserUpdates = Object.values(userFields).some(v => v !== undefined);

      let user = null;
      if (hasUserUpdates) {
        user = await getBlob('users', emailHash);
        if (user) {
          if (name !== undefined) user.name = name;
          if (duprRating !== undefined) user.duprRating = duprRating;
          if (level !== undefined) user.level = level;
          if (timesPerWeek !== undefined) user.timesPerWeek = timesPerWeek;
          if (yearsPlaying !== undefined) user.yearsPlaying = yearsPlaying;
          await putBlob('users', emailHash, user);
        }
      }

      return res.status(200).json({
        profile: updated,
        ...(user && { user }),
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Profile API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
