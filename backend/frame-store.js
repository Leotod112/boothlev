import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const overlayDir = path.join(dataDir, 'frame-overlays');

fs.mkdirSync(overlayDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'frames.sqlite'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS frames (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    frame_json TEXT NOT NULL,
    overlay_filename TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const listStatement = db.prepare('SELECT id, frame_json, overlay_filename FROM frames ORDER BY updated_at DESC');
const getStatement = db.prepare('SELECT id, frame_json, overlay_filename FROM frames WHERE id = ?');
const upsertStatement = db.prepare(`
  INSERT INTO frames (id, name, frame_json, overlay_filename, updated_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    frame_json = excluded.frame_json,
    overlay_filename = excluded.overlay_filename,
    updated_at = CURRENT_TIMESTAMP
`);
const deleteStatement = db.prepare('DELETE FROM frames WHERE id = ?');

function sanitizeId(value) {
  const id = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return id || `frame-${crypto.randomUUID()}`;
}

function normalizeFrame(rawFrame) {
  if (!rawFrame || typeof rawFrame !== 'object') throw new Error('Data bingkai tidak valid.');
  const width = Number(rawFrame.width);
  const height = Number(rawFrame.height);
  const layout = Array.isArray(rawFrame.layout) ? rawFrame.layout : [];

  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100 || width > 10000 || height > 10000) {
    throw new Error('Ukuran bingkai tidak valid.');
  }
  if (layout.length < 1 || layout.length > 24) throw new Error('Jumlah slot harus antara 1 sampai 24.');

  const cleanLayout = layout.map((slot) => {
    const x = Number(slot.x), y = Number(slot.y), w = Number(slot.w), h = Number(slot.h);
    if (![x, y, w, h].every(Number.isFinite) || w < 20 || h < 20) throw new Error('Area slot tidak valid.');
    return { x, y, w, h };
  });

  return {
    id: sanitizeId(rawFrame.id),
    name: String(rawFrame.name || 'Bingkai Baru').trim().slice(0, 100) || 'Bingkai Baru',
    category: 'CUSTOM',
    description: String(rawFrame.description || 'Bingkai buatan pengguna').slice(0, 200),
    width,
    height,
    slots: cleanLayout.length,
    frameColor: String(rawFrame.frameColor || 'transparent'),
    textColor: String(rawFrame.textColor || '#FFFFFF'),
    slotShape: ['square', 'rounded', 'deco', 'wavy'].includes(rawFrame.slotShape) ? rawFrame.slotShape : 'square',
    slotBgColor: String(rawFrame.slotBgColor || '#e5e7eb'),
    slotBorderColor: String(rawFrame.slotBorderColor || 'transparent'),
    slotBorderWidth: Math.max(0, Math.min(50, Number(rawFrame.slotBorderWidth) || 0)),
    layout: cleanLayout,
    stickers: Array.isArray(rawFrame.stickers) ? rawFrame.stickers.slice(0, 50) : [],
  };
}

function frameWithOverlay(row) {
  const frame = JSON.parse(row.frame_json);
  return {
    ...frame,
    overlayUrl: row.overlay_filename ? `/api/frames/${encodeURIComponent(row.id)}/overlay` : null,
  };
}

function getPreviousOverlay(id) {
  const row = getStatement.get(id);
  return row?.overlay_filename || null;
}

function saveOverlay(id, file) {
  if (!file) return null;
  if (!['image/png', 'image/webp'].includes(file.mimetype)) {
    throw new Error('Overlay harus file PNG atau WebP transparan.');
  }
  const extension = file.mimetype === 'image/webp' ? '.webp' : '.png';
  const filename = `${id}-${Date.now()}${extension}`;
  fs.writeFileSync(path.join(overlayDir, filename), file.buffer);
  return filename;
}

export function listFrames() {
  return listStatement.all().map(frameWithOverlay);
}

export function saveFrame(rawFrame, file = null) {
  const frame = normalizeFrame(rawFrame);
  const previousOverlay = getPreviousOverlay(frame.id);
  const newOverlay = saveOverlay(frame.id, file);
  const overlayFilename = newOverlay || previousOverlay || null;

  upsertStatement.run(frame.id, frame.name, JSON.stringify(frame), overlayFilename);

  if (newOverlay && previousOverlay && previousOverlay !== newOverlay) {
    fs.rmSync(path.join(overlayDir, previousOverlay), { force: true });
  }

  return frameWithOverlay(getStatement.get(frame.id));
}

export function getOverlayPath(id) {
  const row = getStatement.get(sanitizeId(id));
  if (!row?.overlay_filename) return null;
  const filePath = path.join(overlayDir, path.basename(row.overlay_filename));
  return fs.existsSync(filePath) ? filePath : null;
}

export function removeFrame(id) {
  const row = getStatement.get(sanitizeId(id));
  if (!row) return false;
  deleteStatement.run(row.id);
  if (row.overlay_filename) fs.rmSync(path.join(overlayDir, path.basename(row.overlay_filename)), { force: true });
  return true;
}
