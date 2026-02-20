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

const MAX_ACTIVITY_ITEMS = 100;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    // Publish an activity event for a user
    if (action === 'publish') {
      const { email, event } = req.body;
      if (!email || !event) {
        return res.status(400).json({ error: 'Email and event are required' });
      }

      const emailHash = hashEmail(email);
      const activities = (await getBlob('activity', emailHash)) || [];

      const newEvent = {
        id: crypto.randomUUID(),
        ...event,
        timestamp: Date.now(),
      };

      // Prepend and cap at MAX_ACTIVITY_ITEMS
      activities.unshift(newEvent);
      if (activities.length > MAX_ACTIVITY_ITEMS) {
        activities.length = MAX_ACTIVITY_ITEMS;
      }

      await putBlob('activity', emailHash, activities);
      return res.status(200).json({ event: newEvent });
    }

    // Get aggregated activity feed from friends
    if (action === 'feed') {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailHash = hashEmail(email);

      // Get user's friends
      const friends = (await getBlob('friends', emailHash)) || [];

      // Aggregate activity from all friends (plus self)
      const allHashes = [emailHash, ...friends.map(f => f.emailHash)];
      const allEvents = [];

      for (const hash of allHashes) {
        const activities = (await getBlob('activity', hash)) || [];
        for (const event of activities) {
          allEvents.push(event);
        }
      }

      // Sort by timestamp descending, limit to 50
      allEvents.sort((a, b) => b.timestamp - a.timestamp);
      const feed = allEvents.slice(0, 50);

      return res.status(200).json({ feed });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Activity API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
