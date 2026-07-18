import { get, set } from "idb-keyval";

const keyFor = (frameId) => `twibbon-overlay:${frameId}`;

export async function saveTwibbonOverlay(frameId, file) {
  await set(keyFor(frameId), file);
}

export async function loadTwibbonOverlay(frameId) {
  const file = await get(keyFor(frameId));
  return file ? URL.createObjectURL(file) : null;
}

export function revokeTwibbonOverlay(url) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
