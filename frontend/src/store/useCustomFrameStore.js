import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default empty template for new custom frames
export const DEFAULT_CUSTOM_FRAME = {
  id: null,
  name: "Bingkai Baru",
  category: "CUSTOM",
  description: "Bingkai buatan sendiri",
  width: 800,
  height: 1200,
  slots: 2,
  frameColor: "#111111",
  textColor: "#FFFFFF",
  slotShape: "square",
  slotBgColor: "#e5e7eb",
  slotBorderColor: "#111111",
  slotBorderWidth: 0,
  layout: [
    { x: 50, y: 50, w: 700, h: 450 },
    { x: 50, y: 550, w: 700, h: 450 },
  ],
  stickers: [],
};

export const useCustomFrameStore = create(
  persist(
    (set, get) => ({
      frames: [],
      editingIndex: -1,
      editingFrame: null,
      hasHydrated: false,
      hasServerLoaded: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setServerFrames: (serverFrames) => set((state) => {
        const remoteIds = new Set(serverFrames.map((frame) => frame.id));
        const localOnly = state.frames.filter((frame) => !remoteIds.has(frame.id));
        return { frames: [...serverFrames, ...localOnly], hasServerLoaded: true };
      }),
      upsertFrame: (frame) => set((state) => {
        const index = state.frames.findIndex((item) => item.id === frame.id);
        if (index < 0) return { frames: [frame, ...state.frames] };
        const frames = [...state.frames];
        frames[index] = frame;
        return { frames };
      }),

      // Load all saved custom frames
      getFrames: () => get().frames,

      // Save a new frame or update existing
      saveFrame: (frame) => set((state) => {
        const newFrame = { ...frame, id: frame.id || `custom-${Date.now()}` };
        const idx = state.frames.findIndex(f => f.id === newFrame.id);
        let newFrames;
        if (idx >= 0) {
          newFrames = [...state.frames];
          newFrames[idx] = newFrame;
        } else {
          newFrames = [...state.frames, newFrame];
        }
        return { frames: newFrames };
      }),

      // Delete a custom frame
      deleteFrame: (id) => set((state) => ({
        frames: state.frames.filter(f => f.id !== id),
      })),

      // Rename a frame
      renameFrame: (id, name) => set((state) => ({
        frames: state.frames.map(f =>
          f.id === id ? { ...f, name } : f
        ),
      })),

      // Start editing a frame
      startEditing: (index) => {
        const state = get();
        if (index >= 0 && index < state.frames.length) {
          set({
            editingIndex: index,
            editingFrame: JSON.parse(JSON.stringify(state.frames[index])),
          });
        } else {
          set({
            editingIndex: -1,
            editingFrame: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_FRAME)),
          });
        }
      },

      // Update the current editing frame
      updateEditingFrame: (updates) => set((state) => ({
        editingFrame: state.editingFrame ? { ...state.editingFrame, ...updates } : null,
      })),

      // Update a slot in the editing frame
      updateSlot: (slotIndex, slotUpdates) => set((state) => {
        if (!state.editingFrame) return state;
        const newLayout = [...state.editingFrame.layout];
        newLayout[slotIndex] = { ...newLayout[slotIndex], ...slotUpdates };
        return {
          editingFrame: { ...state.editingFrame, layout: newLayout },
        };
      }),

      // Set grid: completely replaces layout with N slots auto-arranged
      setGrid: (count) => set((state) => {
        if (!state.editingFrame) return state;
        const ef = state.editingFrame;
        const n = Math.max(1, Math.min(count || 2, 24));
        const cols = Math.min(4, n);
        const rows = Math.ceil(n / cols);
        const gap = 18;
        const m = 35;
        const aw = ef.width - m * 2 - gap * (cols - 1);
        const sw = Math.floor(aw / cols);
        const ah = ef.height - m * 2 - gap * (rows - 1);
        const sh = Math.floor(ah / rows);
        const layout = [];
        for (let i = 0; i < n; i++) {
          layout.push({
            x: m + (i % cols) * (sw + gap),
            y: m + Math.floor(i / cols) * (sh + gap),
            w: sw,
            h: sh,
          });
        }
        return {
          editingFrame: { ...ef, slots: n, layout },
        };
      }),

      // Add a new slot and auto-rearrange all into grid
      addSlot: () => set((state) => {
        if (!state.editingFrame) return state;
        const ef = state.editingFrame;
        const n = ef.layout.length + 1;
        const cols = Math.min(4, n);
        const rows = Math.ceil(n / cols);
        const gap = 18;
        const m = 35;
        const aw = ef.width - m * 2 - gap * (cols - 1);
        const sw = Math.floor(aw / cols);
        const ah = ef.height - m * 2 - gap * (rows - 1);
        const sh = Math.floor(ah / rows);
        const layout = [];
        for (let i = 0; i < n; i++) {
          layout.push({
            x: m + (i % cols) * (sw + gap),
            y: m + Math.floor(i / cols) * (sh + gap),
            w: sw,
            h: sh,
          });
        }
        return {
          editingFrame: { ...ef, slots: n, layout },
        };
      }),

      // Delete a slot and auto-arrange remaining
      deleteSlot: (slotIndex) => set((state) => {
        if (!state.editingFrame || state.editingFrame.layout.length <= 1) return state;
        const ef = state.editingFrame;
        const remaining = ef.layout.filter((_, i) => i !== slotIndex);
        const n = remaining.length;
        const cols = Math.min(4, n);
        const rows = Math.ceil(n / cols);
        const gap = 18;
        const m = 35;
        const aw = ef.width - m * 2 - gap * (cols - 1);
        const sw = Math.floor(aw / cols);
        const ah = ef.height - m * 2 - gap * (rows - 1);
        const sh = Math.floor(ah / rows);
        const layout = [];
        for (let i = 0; i < n; i++) {
          layout.push({
            x: m + (i % cols) * (sw + gap),
            y: m + Math.floor(i / cols) * (sh + gap),
            w: sw,
            h: sh,
          });
        }
        return {
          editingFrame: { ...ef, slots: n, layout },
        };
      }),
    }),
    {
      name: 'syzhaa-custom-frames',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
