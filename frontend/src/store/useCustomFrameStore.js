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

      // Add a new slot
      addSlot: () => set((state) => {
        if (!state.editingFrame) return state;
        const ef = state.editingFrame;
        const cols = Math.min(3, ef.layout.length + 1);
        const rows = Math.ceil((ef.layout.length + 1) / cols);
        const slotW = Math.floor((ef.width - 100) / cols);
        const slotH = Math.floor((ef.height - (rows + 1) * 50) / rows);
        const newSlot = {
          x: 50 + ((ef.layout.length % cols) * (slotW + 10)),
          y: 50 + (Math.floor(ef.layout.length / cols) * (slotH + 50)),
          w: slotW,
          h: slotH,
        };
        return {
          editingFrame: {
            ...ef,
            slots: ef.slots + 1,
            layout: [...ef.layout, newSlot],
          },
        };
      }),

      // Delete a slot
      deleteSlot: (slotIndex) => set((state) => {
        if (!state.editingFrame || state.editingFrame.layout.length <= 1) return state;
        const newLayout = state.editingFrame.layout.filter((_, i) => i !== slotIndex);
        return {
          editingFrame: {
            ...state.editingFrame,
            slots: state.editingFrame.slots - 1,
            layout: newLayout,
          },
        };
      }),

      // Auto-arrange slots into grid
      autoArrange: (cols) => set((state) => {
        if (!state.editingFrame) return state;
        const ef = state.editingFrame;
        const n = ef.layout.length;
        const colsVal = Math.min(cols || 2, n);
        const rows = Math.ceil(n / colsVal);
        const gapX = 16;
        const gapY = 16;
        const marginX = 40;
        const marginY = 50;
        const availableW = ef.width - marginX * 2 - gapX * (colsVal - 1);
        const slotW = Math.floor(availableW / colsVal);
        const availableH = ef.height - marginY * 2 - gapY * (rows - 1);
        const slotH = Math.floor(availableH / rows);

        const newLayout = ef.layout.map((_, i) => ({
          x: marginX + (i % colsVal) * (slotW + gapX),
          y: marginY + Math.floor(i / colsVal) * (slotH + gapY),
          w: slotW,
          h: slotH,
        }));
        return {
          editingFrame: { ...ef, layout: newLayout },
        };
      }),
    }),
    {
      name: 'syzhaa-custom-frames',
    }
  )
);
