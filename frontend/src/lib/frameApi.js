const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';
const FRAME_API = `${API_BASE}/api/frames`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
  });

  if (!response.ok) {
    let message = 'Terjadi kesalahan pada penyimpanan bingkai.';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Server may respond with an empty/non-JSON error body.
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

export async function fetchServerFrames() {
  const data = await request(FRAME_API);
  let frames = Array.isArray(data.frames) ? data.frames : [];
  
  // Convert relative overlay URLs to absolute URLs
  frames = frames.map(f => ({
    ...f,
    overlayUrl: f.overlayUrl ? (f.overlayUrl.startsWith('http') ? f.overlayUrl : `${API_BASE}${f.overlayUrl}`) : null
  }));
  
  return frames;
}

export async function saveServerFrame(frame, overlayFile = null) {
  const body = new FormData();
  body.append('frame', JSON.stringify(frame));
  if (overlayFile) {
    body.append('overlay', overlayFile, overlayFile.name || 'overlay.png');
  }

  const response = await fetch(FRAME_API, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    let message = 'Terjadi kesalahan pada penyimpanan bingkai.';
    try {
      const respBody = await response.json();
      message = respBody.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.frame;
}

export async function deleteServerFrame(id) {
  await request(`${FRAME_API}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
