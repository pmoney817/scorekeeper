import { put, list } from '@vercel/blob';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

async function getBlob(type, key) {
  try {
    const { blobs } = await list({ prefix: `${type}/${key}.json` });
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
  await put(`${type}/${key}.json`, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundary = Buffer.from(`--${boundary}--`);

  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;

  while (start < buffer.length) {
    // Skip CRLF after boundary
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) start += 2;

    const nextBoundary = buffer.indexOf(boundaryBuffer, start);
    if (nextBoundary === -1) break;

    const partData = buffer.slice(start, nextBoundary);

    // Split headers from body (separated by \r\n\r\n)
    const headerEnd = partData.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = nextBoundary + boundaryBuffer.length; continue; }

    const headersStr = partData.slice(0, headerEnd).toString('utf-8');
    // Body ends 2 bytes before the boundary (trailing \r\n)
    const body = partData.slice(headerEnd + 4, partData.length - 2);

    const headers = {};
    for (const line of headersStr.split('\r\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        headers[line.slice(0, colonIdx).toLowerCase().trim()] = line.slice(colonIdx + 1).trim();
      }
    }

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);

    parts.push({
      name: nameMatch ? nameMatch[1] : null,
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: headers['content-type'] || null,
      data: body,
    });

    start = nextBoundary + boundaryBuffer.length;
    // Check for end boundary
    if (buffer.slice(nextBoundary, nextBoundary + endBoundary.length).equals(endBoundary)) break;
  }

  return parts;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Check size (2MB max)
    if (buffer.length > 2 * 1024 * 1024 + 1024) {
      return res.status(413).json({ error: 'File too large. Max 2MB.' });
    }

    // Extract boundary from content-type
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Missing multipart boundary' });
    }
    const boundary = boundaryMatch[1].replace(/^"(.*)"$/, '$1');

    // Parse multipart
    const parts = parseMultipart(buffer, boundary);

    const emailPart = parts.find(p => p.name === 'email');
    const filePart = parts.find(p => p.name === 'avatar');

    if (!emailPart || !filePart) {
      return res.status(400).json({ error: 'Missing email or avatar file' });
    }

    const email = emailPart.data.toString('utf-8').trim();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(filePart.contentType)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' });
    }

    // Validate file size
    if (filePart.data.length > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large. Max 2MB.' });
    }

    const emailHash = hashEmail(email);

    // Determine file extension
    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[filePart.contentType];

    // Upload to Vercel Blob
    const blob = await put(`avatars/${emailHash}.${ext}`, filePart.data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: filePart.contentType,
    });

    // Update user blob with avatarUrl
    const user = await getBlob('users', emailHash);
    if (user) {
      user.avatarUrl = blob.url;
      await putBlob('users', emailHash, user);
    }

    return res.status(200).json({ avatarUrl: blob.url });
  } catch (e) {
    console.error('Avatar upload error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
