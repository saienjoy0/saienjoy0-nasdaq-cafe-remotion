export const SEQUENCE_POLICY_IDS = [
  "explicit",
  "object-order-fallback",
  "static",
] as const;

export const MOTION_PRESET_IDS = [
  "fade-soft",
  "slide-soft-left",
  "slide-soft-right",
  "rise-soft",
  "scale-settle",
  "grow-from-baseline",
  "grow-from-center",
  "draw-line",
  "count-up",
  "focus-ring",
  "scale-focus",
  "dim-others",
  "pulse-once",
  "fade-out",
  "slide-out-soft",
  "collapse-to-outcome",
] as const;

export const EASING_PRESET_IDS = [
  "smooth-out",
  "spring-settle",
  "linear",
] as const;

export type SequencePolicy = typeof SEQUENCE_POLICY_IDS[number];
export type MotionPreset = typeof MOTION_PRESET_IDS[number];
export type EasingPreset = typeof EASING_PRESET_IDS[number];
export type MotionAction = "show" | "hide" | "highlight" | "unhighlight";

export const MOTION_PRESETS_BY_ACTION: Record<MotionAction, readonly MotionPreset[]> = {
  show: [
    "fade-soft",
    "slide-soft-left",
    "slide-soft-right",
    "rise-soft",
    "scale-settle",
    "grow-from-baseline",
    "grow-from-center",
    "draw-line",
    "count-up",
  ],
  hide: ["fade-out", "slide-out-soft", "collapse-to-outcome"],
  highlight: ["focus-ring", "scale-focus", "dim-others", "pulse-once"],
  unhighlight: ["fade-soft", "scale-settle"],
};

export const DEFAULT_MOTION_DURATION_MS: Record<MotionPreset, number> = {
  "fade-soft": 420,
  "slide-soft-left": 560,
  "slide-soft-right": 560,
  "rise-soft": 560,
  "scale-settle": 620,
  "grow-from-baseline": 680,
  "grow-from-center": 680,
  "draw-line": 720,
  "count-up": 760,
  "focus-ring": 420,
  "scale-focus": 480,
  "dim-others": 420,
  "pulse-once": 520,
  "fade-out": 360,
  "slide-out-soft": 460,
  "collapse-to-outcome": 620,
};

export const isMotionPresetAllowed = (
  action: MotionAction,
  preset: MotionPreset,
) => MOTION_PRESETS_BY_ACTION[action].includes(preset);
