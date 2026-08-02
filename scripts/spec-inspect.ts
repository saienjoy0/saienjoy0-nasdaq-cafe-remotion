import {execFile} from "node:child_process";
import {stat} from "node:fs/promises";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);
export type InspectStatus = "not-generated" | "valid" | "invalid-codec" | "invalid-fps" | "invalid-resolution" | "missing-audio" | "invalid-audio-format" | "duration-mismatch" | "decode-failed" | "zero-byte";
export type MediaExpectation = {codec: string; fps: number; width: number; height: number; sampleRate: number; channels: number; durationMs: number; toleranceMs: number};

export const inspectSpecMedia = async (file: string, expected: MediaExpectation) => {
  let info;
  try {
    info = await stat(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {status: "not-generated" as InspectStatus, path: file};
    throw error;
  }
  if (info.size === 0) return {status: "zero-byte" as InspectStatus, path: file, bytes: 0};
  let parsed: {streams?: Array<Record<string, unknown>>; format?: Record<string, unknown>};
  try {
    const {stdout} = await execFileAsync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], {windowsHide: true, maxBuffer: 16 * 1024 * 1024});
    parsed = JSON.parse(stdout) as typeof parsed;
  } catch (error) {
    return {status: "decode-failed" as InspectStatus, path: file, bytes: info.size, error: error instanceof Error ? error.message : String(error)};
  }
  const video = parsed.streams?.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams?.find((stream) => stream.codec_type === "audio");
  const fpsText = String(video?.avg_frame_rate ?? video?.r_frame_rate ?? "0/1");
  const [numerator, denominator] = fpsText.split("/").map(Number);
  const fps = denominator ? numerator / denominator : 0;
  const durationMs = Math.round(Number(parsed.format?.duration ?? video?.duration ?? 0) * 1000);
  let status: InspectStatus = "valid";
  if (video?.codec_name !== expected.codec) status = "invalid-codec";
  else if (Math.abs(fps - expected.fps) > 0.001) status = "invalid-fps";
  else if (video?.width !== expected.width || video?.height !== expected.height) status = "invalid-resolution";
  else if (!audio) status = "missing-audio";
  else if (Number(audio.sample_rate) !== expected.sampleRate || audio.channels !== expected.channels) status = "invalid-audio-format";
  else if (Math.abs(durationMs - expected.durationMs) > expected.toleranceMs) status = "duration-mismatch";
  if (status === "valid") {
    try {
      await execFileAsync("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], {windowsHide: true, maxBuffer: 16 * 1024 * 1024});
    } catch (error) {
      status = "decode-failed";
      return {status, path: file, bytes: info.size, error: error instanceof Error ? error.message : String(error)};
    }
  }
  return {
    status,
    path: file,
    bytes: info.size,
    codec: video?.codec_name,
    fps,
    width: video?.width,
    height: video?.height,
    audioStream: Boolean(audio),
    audioCodec: audio?.codec_name,
    sampleRate: Number(audio?.sample_rate ?? 0),
    channels: Number(audio?.channels ?? 0),
    durationMs,
    expectedDurationMs: expected.durationMs,
    durationDeltaMs: durationMs - expected.durationMs,
    fullDecode: status === "valid",
  };
};
