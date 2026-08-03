import {execFile} from "node:child_process";
import {stat} from "node:fs/promises";
import {promisify} from "node:util";

const execFileAsync = promisify(execFile);
export type InspectStatus =
  | "not-generated"
  | "valid"
  | "invalid-stream-count"
  | "invalid-codec"
  | "invalid-pixel-format"
  | "invalid-fps"
  | "invalid-resolution"
  | "missing-audio"
  | "invalid-audio-codec"
  | "invalid-audio-format"
  | "duration-mismatch"
  | "audio-video-duration-mismatch"
  | "silent-audio"
  | "decode-failed"
  | "zero-byte";
export type MediaExpectation = {
  codec: string;
  fps: number;
  width: number;
  height: number;
  sampleRate: number;
  channels: number;
  durationMs: number;
  toleranceMs: number;
  videoStreams?: number;
  audioStreams?: number;
  pixelFormat?: string;
  audioCodec?: string;
  requireNonSilentAudio?: boolean;
};

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
  const videoStreams = parsed.streams?.filter((stream) => stream.codec_type === "video") ?? [];
  const audioStreams = parsed.streams?.filter((stream) => stream.codec_type === "audio") ?? [];
  const video = videoStreams[0];
  const audio = audioStreams[0];
  const fpsText = String(video?.avg_frame_rate ?? video?.r_frame_rate ?? "0/1");
  const [numerator, denominator] = fpsText.split("/").map(Number);
  const fps = denominator ? numerator / denominator : 0;
  const formatDurationMs = Math.round(numberValue(parsed.format?.duration) * 1000);
  const videoDurationMs = Math.round((numberValue(video?.duration) || numberValue(parsed.format?.duration)) * 1000);
  const audioDurationMs = Math.round((numberValue(audio?.duration) || numberValue(parsed.format?.duration)) * 1000);
  const durationMs = formatDurationMs || videoDurationMs || audioDurationMs;
  const expectedVideoStreams = expected.videoStreams ?? 1;
  const expectedAudioStreams = expected.audioStreams ?? 1;
  let status: InspectStatus = "valid";
  let maxVolumeDb: number | null = null;
  if (videoStreams.length !== expectedVideoStreams || audioStreams.length > expectedAudioStreams) status = "invalid-stream-count";
  else if (video?.codec_name !== expected.codec) status = "invalid-codec";
  else if (expected.pixelFormat && video?.pix_fmt !== expected.pixelFormat) status = "invalid-pixel-format";
  else if (Math.abs(fps - expected.fps) > 0.001) status = "invalid-fps";
  else if (video?.width !== expected.width || video?.height !== expected.height) status = "invalid-resolution";
  else if (!audio) status = "missing-audio";
  else if (audioStreams.length !== expectedAudioStreams) status = "invalid-stream-count";
  else if (expected.audioCodec && audio.codec_name !== expected.audioCodec) status = "invalid-audio-codec";
  else if (Number(audio.sample_rate) !== expected.sampleRate || audio.channels !== expected.channels) status = "invalid-audio-format";
  else if (Math.abs(durationMs - expected.durationMs) > expected.toleranceMs) status = "duration-mismatch";
  else if (Math.abs(videoDurationMs - audioDurationMs) > expected.toleranceMs) status = "audio-video-duration-mismatch";
  if (status === "valid") {
    try {
      await execFileAsync("ffmpeg", ["-v", "error", "-xerror", "-i", file, "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"], {windowsHide: true, maxBuffer: 16 * 1024 * 1024});
      if (expected.requireNonSilentAudio) {
        const {stderr} = await execFileAsync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"], {windowsHide: true, maxBuffer: 16 * 1024 * 1024});
        const match = stderr.match(/max_volume:\s*(-?inf|-?[0-9.]+)\s*dB/i);
        maxVolumeDb = !match || match[1].toLowerCase() === "-inf" ? Number.NEGATIVE_INFINITY : Number(match[1]);
        if (!Number.isFinite(maxVolumeDb) || maxVolumeDb <= -80) status = "silent-audio";
      }
    } catch (error) {
      status = "decode-failed";
      return {status, path: file, bytes: info.size, error: error instanceof Error ? error.message : String(error)};
    }
  }
  return {
    status,
    path: file,
    bytes: info.size,
    videoStreamCount: videoStreams.length,
    audioStreamCount: audioStreams.length,
    codec: video?.codec_name,
    pixelFormat: video?.pix_fmt,
    fps,
    width: video?.width,
    height: video?.height,
    audioStream: Boolean(audio),
    audioCodec: audio?.codec_name,
    sampleRate: Number(audio?.sample_rate ?? 0),
    channels: Number(audio?.channels ?? 0),
    durationMs,
    formatDurationMs,
    videoDurationMs,
    audioDurationMs,
    audioVideoDurationDeltaMs: videoDurationMs - audioDurationMs,
    expectedDurationMs: expected.durationMs,
    durationDeltaMs: durationMs - expected.durationMs,
    maxVolumeDb,
    fullDecode: status === "valid",
  };
};
