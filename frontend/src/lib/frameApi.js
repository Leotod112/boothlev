const FRAME_API = '/api/frames';

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
  return Array.isArray(data.frames) ? data.frames : [];
}

export async function saveServerFrame(frame, overlayFile = null) {
  const body = new FormData();
  body.append('frame', JSON.stringify(frame));
  if (overlayFile) body.append('overlay', overlayFile, overlayFile.name || 'overlay.png');

  const data = await request(FRAME_API, {
    method: 'POST',
    body,
  });
  return data.frame;
}

export async function deleteServerFrame(id) {
  await request(`${FRAME_API}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
