export const templates = [
  // --- PHOTOSTRIP CATEGORY ---
  {
    id: "strip-3",
    category: "PHOTOSTRIP",
    name: "Classic 3 Strip",
    description: "3 vertical photos",
    width: 600, height: 1500, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 500, h: 350 },
      { x: 50, y: 450, w: 500, h: 350 },
      { x: 50, y: 850, w: 500, h: 350 }
    ],
    stickers: [
      { emoji: "⚡", x: -40, y: 1200, size: 250 },
      { emoji: "🎸", x: 400, y: 700, size: 220 },
      { emoji: "🕺", x: -50, y: 300, size: 200 },
      { emoji: "✨", x: 200, y: 20, size: 120 },
      { emoji: "🎉", x: 420, y: 100, size: 180 },
      { emoji: "🎤", x: -30, y: 850, size: 160 }
    ]
  },
  {
    id: "strip-4",
    category: "PHOTOSTRIP",
    name: "Classic 4 Strip",
    description: "4 vertical photos",
    width: 600, height: 1900, slots: 4,
    frameColor: "#FFFFFF", textColor: "#111111", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 500, h: 350 },
      { x: 50, y: 450, w: 500, h: 350 },
      { x: 50, y: 850, w: 500, h: 350 },
      { x: 50, y: 1250, w: 500, h: 350 }
    ],
    stickers: [
      { emoji: "🔥", x: 0, y: 1650, size: 280 },
      { emoji: "💯", x: 350, y: 1100, size: 200 },
      { emoji: "💥", x: -50, y: 700, size: 250 },
      { emoji: "😎", x: 380, y: 300, size: 220 },
      { emoji: "🙌", x: 200, y: 20, size: 180 },
      { emoji: "🧨", x: 420, y: 1550, size: 190 }
    ]
  },
  {
    id: "strip-3-spaced",
    category: "PHOTOSTRIP",
    name: "Spaced 3 Strip",
    description: "3 photos with wide gaps",
    width: 600, height: 1800, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 500, h: 400 },
      { x: 50, y: 550, w: 500, h: 400 },
      { x: 50, y: 1050, w: 500, h: 400 }
    ],
    stickers: [
      { emoji: "🚀", x: 350, y: 1500, size: 280 },
      { emoji: "🪐", x: -60, y: 900, size: 250 },
      { emoji: "👽", x: 400, y: 400, size: 220 },
      { emoji: "🌠", x: -30, y: -20, size: 200 },
      { emoji: "🛸", x: 150, y: 1350, size: 180 },
      { emoji: "☄️", x: -20, y: 450, size: 150 }
    ]
  },
  {
    id: "strip-3-rounded",
    category: "PHOTOSTRIP",
    name: "Rounded 3 Strip",
    description: "3 rounded photos",
    width: 600, height: 1500, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "rounded",
    layout: [
      { x: 50, y: 50, w: 500, h: 350 },
      { x: 50, y: 450, w: 500, h: 350 },
      { x: 50, y: 850, w: 500, h: 350 }
    ],
    stickers: [
      { emoji: "🧸", x: 350, y: 1250, size: 250 },
      { emoji: "🎈", x: -50, y: 700, size: 280 },
      { emoji: "☁️", x: 350, y: 300, size: 200 },
      { emoji: "🎀", x: 150, y: -30, size: 180 },
      { emoji: "🍭", x: 400, y: -10, size: 150 },
      { emoji: "🎠", x: -40, y: 1100, size: 220 }
    ]
  },
  {
    id: "strip-3-wavy",
    category: "PHOTOSTRIP",
    name: "Wavy 3 Strip",
    description: "3 wavy vertical photos",
    width: 600, height: 1500, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "wavy",
    layout: [
      { x: 50, y: 50, w: 500, h: 350 },
      { x: 50, y: 450, w: 500, h: 350 },
      { x: 50, y: 850, w: 500, h: 350 }
    ],
    stickers: [
      { emoji: "🌸", x: 200, y: 1250, size: 280 },
      { emoji: "🦋", x: -50, y: 700, size: 220 },
      { emoji: "🐝", x: 400, y: 300, size: 180 },
      { emoji: "🌷", x: 10, y: -30, size: 250 },
      { emoji: "🌺", x: 450, y: 800, size: 160 },
      { emoji: "🍄", x: -20, y: 350, size: 140 }
    ]
  },
  {
    id: "strip-3-deco",
    category: "PHOTOSTRIP",
    name: "Deco 3 Strip",
    description: "3 decorative frames",
    width: 600, height: 1500, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "deco",
    layout: [
      { x: 50, y: 50, w: 500, h: 350 },
      { x: 50, y: 450, w: 500, h: 350 },
      { x: 50, y: 850, w: 500, h: 350 }
    ],
    stickers: [
      { emoji: "👑", x: 180, y: 1200, size: 250 },
      { emoji: "💎", x: -40, y: 700, size: 220 },
      { emoji: "🥂", x: 400, y: 300, size: 220 },
      { emoji: "✨", x: 10, y: -20, size: 180 },
      { emoji: "💄", x: 450, y: 900, size: 160 },
      { emoji: "👛", x: -30, y: 250, size: 180 }
    ]
  },

  // --- 4X6 / 4R CATEGORY ---
  {
    id: "4r-single-h",
    category: "4X6 / 4R",
    name: "Landscape Single",
    description: "1 large horizontal",
    width: 1200, height: 800, slots: 1,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [{ x: 50, y: 50, w: 1100, h: 600 }],
    stickers: [
      { emoji: "✈️", x: 950, y: 550, size: 250 },
      { emoji: "🌴", x: -30, y: 550, size: 300 },
      { emoji: "🏖️", x: -50, y: -20, size: 280 },
      { emoji: "☀️", x: 1000, y: -40, size: 260 },
      { emoji: "🗺️", x: 450, y: 620, size: 150 },
      { emoji: "🍹", x: 800, y: -10, size: 180 }
    ]
  },
  {
    id: "4r-grid-4",
    category: "4X6 / 4R",
    name: "Grid 2x2",
    description: "4 equal slots",
    width: 1200, height: 800, slots: 4,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 525, h: 275 },
      { x: 625, y: 50, w: 525, h: 275 },
      { x: 50, y: 375, w: 525, h: 275 },
      { x: 625, y: 375, w: 525, h: 275 }
    ],
    stickers: [
      { emoji: "🎨", x: 480, y: 250, size: 280 },
      { emoji: "🖌️", x: -50, y: 550, size: 250 },
      { emoji: "🌈", x: 950, y: -40, size: 280 },
      { emoji: "🎭", x: 1000, y: 550, size: 250 },
      { emoji: "✂️", x: 500, y: 600, size: 160 },
      { emoji: "🖍️", x: 0, y: -10, size: 180 }
    ]
  },
  {
    id: "4r-left-large",
    category: "4X6 / 4R",
    name: "Left Focus",
    description: "1 large left, 2 right",
    width: 1200, height: 800, slots: 3,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 700, h: 600 },
      { x: 800, y: 50, w: 350, h: 275 },
      { x: 800, y: 375, w: 350, h: 275 }
    ],
    stickers: [
      { emoji: "🎮", x: 600, y: 450, size: 300 },
      { emoji: "👾", x: 1000, y: 200, size: 220 },
      { emoji: "🕹️", x: -50, y: 550, size: 280 },
      { emoji: "🎧", x: 1000, y: -40, size: 250 },
      { emoji: "🏆", x: 300, y: -20, size: 160 },
      { emoji: "🎯", x: -20, y: -10, size: 180 }
    ]
  },
  {
    id: "4r-single-v",
    category: "4X6 / 4R",
    name: "Portrait Single",
    description: "1 large vertical",
    width: 800, height: 1200, slots: 1,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [{ x: 50, y: 50, w: 700, h: 900 }],
    stickers: [
      { emoji: "🛹", x: 550, y: 850, size: 280 },
      { emoji: "🧱", x: -50, y: 850, size: 250 },
      { emoji: "🏙️", x: 600, y: -20, size: 250 },
      { emoji: "🚦", x: -40, y: -40, size: 280 },
      { emoji: "👟", x: 350, y: 950, size: 160 },
      { emoji: "🧢", x: 200, y: -10, size: 150 }
    ]
  },
  {
    id: "4r-2-stacked",
    category: "4X6 / 4R",
    name: "Stacked Double",
    description: "2 horizontal slots",
    width: 800, height: 1200, slots: 2,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 700, h: 425 },
      { x: 50, y: 525, w: 700, h: 425 }
    ],
    stickers: [
      { emoji: "🍔", x: -50, y: 850, size: 280 },
      { emoji: "🍟", x: 600, y: 850, size: 300 },
      { emoji: "🥤", x: 600, y: 350, size: 250 },
      { emoji: "🍕", x: -30, y: 350, size: 250 },
      { emoji: "🍩", x: -10, y: -20, size: 180 },
      { emoji: "🌭", x: 650, y: -10, size: 160 }
    ]
  },

  // --- POLAROID CATEGORY ---
  {
    id: "polaroid-sq",
    category: "POLAROID",
    name: "Classic Polaroid",
    description: "1 square slot",
    width: 800, height: 1000, slots: 1,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [{ x: 50, y: 50, w: 700, h: 700 }],
    stickers: [
      { emoji: "📻", x: 580, y: 650, size: 250 },
      { emoji: "📼", x: -50, y: 650, size: 250 },
      { emoji: "💾", x: -30, y: -30, size: 220 },
      { emoji: "📟", x: 600, y: -30, size: 220 },
      { emoji: "🕹️", x: 300, y: 750, size: 150 },
      { emoji: "📺", x: -20, y: 300, size: 180 }
    ]
  },
  {
    id: "polaroid-h",
    category: "POLAROID",
    name: "Wide Polaroid",
    description: "1 horizontal slot",
    width: 800, height: 1000, slots: 1,
    frameColor: "#FFFFFF", textColor: "#111111", slotShape: "square",
    layout: [{ x: 50, y: 50, w: 700, h: 500 }],
    stickers: [
      { emoji: "🍿", x: -40, y: 480, size: 320 },
      { emoji: "🎬", x: 550, y: 400, size: 280 },
      { emoji: "🎞️", x: 600, y: -30, size: 220 },
      { emoji: "🎟️", x: -30, y: -30, size: 220 },
      { emoji: "🎥", x: 280, y: 650, size: 280 },
      { emoji: "😎", x: 650, y: 150, size: 150 },
      { emoji: "🥤", x: 550, y: 700, size: 300 },
      { emoji: "⭐", x: 100, y: 780, size: 160 },
      { emoji: "✨", x: 450, y: 820, size: 120 }
    ]
  },
  {
    id: "polaroid-wavy",
    category: "POLAROID",
    name: "Wavy Polaroid",
    description: "1 wavy slot",
    width: 800, height: 1000, slots: 1,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "wavy",
    layout: [{ x: 50, y: 50, w: 700, h: 700 }],
    stickers: [
      { emoji: "🧺", x: 550, y: 650, size: 300 },
      { emoji: "🍓", x: -50, y: 650, size: 250 },
      { emoji: "🧁", x: -30, y: -30, size: 220 },
      { emoji: "🍉", x: 600, y: -30, size: 250 },
      { emoji: "🍒", x: 350, y: 750, size: 160 },
      { emoji: "🐜", x: 100, y: -10, size: 120 }
    ]
  },
  {
    id: "polaroid-deco",
    category: "POLAROID",
    name: "Deco Polaroid",
    description: "1 decorative slot",
    width: 800, height: 1000, slots: 1,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "deco",
    layout: [{ x: 50, y: 50, w: 700, h: 700 }],
    stickers: [
      { emoji: "💅", x: -50, y: 650, size: 280 },
      { emoji: "💄", x: 580, y: 650, size: 250 },
      { emoji: "💍", x: -30, y: -30, size: 220 },
      { emoji: "💋", x: 600, y: -30, size: 250 },
      { emoji: "🎀", x: 300, y: -20, size: 160 },
      { emoji: "💖", x: 650, y: 300, size: 150 }
    ]
  },
  {
    id: "polaroid-2-stacked",
    category: "POLAROID",
    name: "Double Polaroid",
    description: "2 stacked slots",
    width: 800, height: 1200, slots: 2,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 700, h: 450 },
      { x: 50, y: 550, w: 700, h: 450 }
    ],
    stickers: [
      { emoji: "🔮", x: -50, y: 900, size: 280 },
      { emoji: "🌙", x: 580, y: 900, size: 250 },
      { emoji: "🌌", x: 600, y: 400, size: 220 },
      { emoji: "🦉", x: -30, y: 400, size: 200 },
      { emoji: "✨", x: 350, y: 1000, size: 160 },
      { emoji: "🪐", x: 650, y: -20, size: 180 }
    ]
  }
];

// --- TAMBAHAN CUSTOM PHOTOSTRIP (Terinspirasi tren studio) ---
templates.push(
  {
    id: "strip-4-film",
    category: "PHOTOSTRIP",
    name: "Film Negative",
    description: "4 slots with film border",
    width: 600, height: 2100, slots: 4,
    frameColor: "#000000", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 75, y: 100, w: 450, h: 350 },
      { x: 75, y: 550, w: 450, h: 350 },
      { x: 75, y: 1000, w: 450, h: 350 },
      { x: 75, y: 1450, w: 450, h: 350 }
    ],
    stickers: [
      { emoji: "🎞️", x: 10, y: 10, size: 100 },
      { emoji: "🎞️", x: 490, y: 10, size: 100 },
      { emoji: "🎥", x: 220, y: 1850, size: 150 }
    ]
  },
  {
    id: "strip-2-wide",
    category: "PHOTOSTRIP",
    name: "Wide 2 Strip",
    description: "2 landscape photos",
    width: 600, height: 1200, slots: 2,
    frameColor: "#FFFFFF", textColor: "#111111", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 500, h: 450 },
      { x: 50, y: 550, w: 500, h: 450 }
    ],
    stickers: [
      { emoji: "✨", x: 200, y: 1050, size: 120 },
      { emoji: "🤍", x: 450, y: 1020, size: 140 }
    ]
  },
  {
    id: "grid-3x3",
    category: "4X6 / 4R",
    name: "Mini Grid 9",
    description: "3x3 square photos",
    width: 1200, height: 1200, slots: 9,
    frameColor: "#111111", textColor: "#FFFFFF", slotShape: "square",
    layout: [
      { x: 50, y: 50, w: 340, h: 340 }, { x: 430, y: 50, w: 340, h: 340 }, { x: 810, y: 50, w: 340, h: 340 },
      { x: 50, y: 430, w: 340, h: 340 }, { x: 430, y: 430, w: 340, h: 340 }, { x: 810, y: 430, w: 340, h: 340 },
      { x: 50, y: 810, w: 340, h: 340 }, { x: 430, y: 810, w: 340, h: 340 }, { x: 810, y: 810, w: 340, h: 340 }
    ],
    stickers: [
      { emoji: "📸", x: -40, y: 1050, size: 200 },
      { emoji: "⚡", x: 1050, y: -20, size: 180 }
    ]
  },
  {
    id: "polaroid-collage",
    category: "POLAROID",
    name: "Collage 3",
    description: "3 offset photos",
    width: 1000, height: 1200, slots: 3,
    frameColor: "#F4F4F4", textColor: "#111111", slotShape: "square",
    layout: [
      { x: 100, y: 50, w: 450, h: 450 },
      { x: 450, y: 250, w: 450, h: 450 },
      { x: 150, y: 650, w: 450, h: 450 }
    ],
    stickers: [
      { emoji: "📌", x: 480, y: 20, size: 120 },
      { emoji: "📎", x: 850, y: 220, size: 150 },
      { emoji: "🔖", x: 100, y: 620, size: 140 }
    ]
  },
  {
    id: "pixenze-psychedelic-6",
    category: "PHOTOSTRIP",
    name: "Pixenze Psychedelic",
    description: "6-photo retro mushroom frame",
    width: 900, height: 1600, slots: 6,
    frameColor: "#80C9ED", textColor: "#FFF0C7", slotShape: "rounded",
    specialFrame: "pixenze",
    slotBgColor: "#050505",
    slotBorderColor: "#FFF0C7",
    slotBorderWidth: 14,
    hideDefaultFooter: true,
    layout: [
      { x: 96, y: 420, w: 318, h: 280 },
      { x: 486, y: 420, w: 318, h: 280 },
      { x: 96, y: 735, w: 318, h: 280 },
      { x: 486, y: 735, w: 318, h: 280 },
      { x: 96, y: 1050, w: 318, h: 280 },
      { x: 486, y: 1050, w: 318, h: 280 }
    ],
    stickers: []
  }
);
