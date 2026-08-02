export type LayoutZone = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// Contract 2.4.1 fixed 1920x1080 shell. Scene components consume these zones.
export const phase0Layout = {
  provisional: false,
  canvas: {
    width: 1920,
    height: 1080,
  },
  safeArea: {
    top: 48,
    right: 64,
    bottom: 48,
    left: 64,
  },
  fox: {
    left: 64,
    top: 176,
    width: 320,
    height: 720,
  },
  content: {
    left: 416,
    top: 144,
    width: 1440,
    height: 648,
  },
  headline: {
    left: 416,
    top: 56,
    width: 1440,
    height: 72,
  },
  caption: {
    left: 416,
    top: 824,
    width: 1440,
    height: 176,
  },
  legacyFoxBadge: {
    right: 74,
    bottom: 14,
  },
} as const;
