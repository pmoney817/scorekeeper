import { put, list } from '@vercel/blob';
import crypto from 'crypto';

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function blobPath(emailHash) {
  return `users/${emailHash}.json`;
}

async function getUser(emailHash) {
  try {
    const { blobs } = await list({ prefix: blobPath(emailHash) });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getUser error:', e);
    return null;
  }
}

async function putUser(emailHash, data) {
  await put(blobPath(emailHash), JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
  });
}

function sanitizeUser(user) {
  const { passwordHash, ...profile } = user;
  return profile;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    if (action === 'signup') {
      const { name, email, password, dob, level, timesPerWeek, yearsPlaying } = req.body;

      if (!name || !email || !password || !dob || !level || !timesPerWeek || !yearsPlaying) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const emailHash = hashEmail(email);
      const existing = await getUser(emailHash);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const userData = {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        dob,
        level,
        timesPerWeek,
        yearsPlaying,
        createdAt: Date.now(),
      };

      await putUser(emailHash, userData);
      return res.status(200).json({ user: sanitizeUser(userData) });
    }

    if (action === 'login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const emailHash = hashEmail(email);
      const user = await getUser(emailHash);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      return res.status(200).json({ user: sanitizeUser(user) });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Auth API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
