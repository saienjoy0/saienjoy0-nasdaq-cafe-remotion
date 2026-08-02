import type {CSSProperties} from "react";
import {fontFamily} from "../fonts";

export const colors = {
  background: "#030711",
  panel: "rgba(8, 19, 36, 0.84)",
  panelStrong: "rgba(7, 24, 44, 0.96)",
  cyan: "#35D9FF",
  cyanSoft: "#8AEAFF",
  blue: "#367CFF",
  amber: "#FFBD4A",
  red: "#FF596A",
  green: "#42E8A4",
  text: "#F4FAFF",
  muted: "#9BB1C8",
  line: "rgba(118, 194, 230, 0.22)",
} as const;

export const baseFont: CSSProperties = {
  fontFamily,
  color: colors.text,
  fontVariantNumeric: "tabular-nums",
  WebkitFontSmoothing: "antialiased",
};

export const safeArea = {
  top: 100,
  right: 100,
  bottom: 126,
  left: 100,
} as const;

export const directionColor = (direction: "up" | "down" | "flat") => {
  if (direction === "up") return colors.green;
  if (direction === "down") return colors.red;
  return colors.cyanSoft;
};

export const directionMark = (direction: "up" | "down" | "flat") => {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "●";
};

export const responsiveHeadlineSize = (
  text: string,
  max = 132,
  min = 82,
  threshold = 13,
) => Math.max(min, max - Math.max(0, text.length - threshold) * 2.5);
