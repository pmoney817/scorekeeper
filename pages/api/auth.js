import { put, list } from '@vercel/blob';
import crypto from 'crypto';

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  // Support legacy SHA-256 hashes (no colon separator)
  if (!stored.includes(':')) {
    return stored === crypto.createHash('sha256').update(password).digest('hex');
  }
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verify;
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

function hashSecurityAnswer(answer) {
  return crypto.createHash('sha256').update(answer.toLowerCase().trim()).digest('hex');
}

function sanitizeUser(user) {
  const { passwordHash, securityAnswerHash, ...profile } = user;
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
      const { name, email, password, dob, level, timesPerWeek, yearsPlaying, duprRating, securityQuestion, securityAnswer } = req.body;

      if (!name || !email || !password || !dob || !level || !timesPerWeek || !yearsPlaying || !securityQuestion || !securityAnswer) {
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
        duprRating: duprRating || null,
        securityQuestion,
        securityAnswerHash: hashSecurityAnswer(securityAnswer),
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

      if (!verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Migrate legacy SHA-256 hash to PBKDF2 on successful login
      if (!user.passwordHash.includes(':')) {
        user.passwordHash = hashPassword(password);
        await putUser(emailHash, user);
      }

      return res.status(200).json({ user: sanitizeUser(user) });
    }

    if (action === 'reset-password') {
      const { email, newPassword, securityAnswer } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailHash = hashEmail(email);
      const user = await getUser(emailHash);

      if (!user) {
        return res.status(404).json({ error: 'No account found with this email' });
      }

      if (!newPassword) {
        // Step 1: Verify email exists and return security question
        return res.status(200).json({
          exists: true,
          securityQuestion: user.securityQuestion || null,
        });
      }

      // Step 2: Verify security answer and set new password
      if (user.securityQuestion && user.securityAnswerHash) {
        if (!securityAnswer) {
          return res.status(400).json({ error: 'Security answer is required' });
        }
        if (hashSecurityAnswer(securityAnswer) !== user.securityAnswerHash) {
          return res.status(403).json({ error: 'Incorrect security answer' });
        }
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      user.passwordHash = hashPassword(newPassword);
      await putUser(emailHash, user);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Auth API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
