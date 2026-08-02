import type {CSSProperties, ReactNode} from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const enterProgress = (
  frame: number,
  start = 0,
  duration = 24,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

export const exitProgress = (
  frame: number,
  start: number,
  duration = 15,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

export const Reveal: React.FC<{
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  axis?: "x" | "y";
  style?: CSSProperties;
}> = ({
  children,
  delay = 0,
  duration = 24,
  distance = 42,
  axis = "y",
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, delay, duration);
  const offset = interpolate(progress, [0, 1], [distance, 0]);

  return (
    <div
      style={{
        opacity: progress,
        translate: axis === "x" ? `${offset}px 0` : `0 ${offset}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const AnimatedValue: React.FC<{
  value: string;
  delay?: number;
}> = ({value, delay = 0}) => {
  const frame = useCurrentFrame();
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);

  if (!match) return <>{value}</>;

  const [, prefix, rawNumber, suffix] = match;
  const numeric = Number(rawNumber);
  const decimals = rawNumber.includes(".") ? rawNumber.split(".")[1].length : 0;
  const progress = enterProgress(frame, delay, 30);
  const current = interpolate(progress, [0, 1], [0, numeric]);

  return (
    <>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </>
  );
};
