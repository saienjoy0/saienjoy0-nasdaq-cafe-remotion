import {Audio} from "@remotion/media";
import {Sequence} from "remotion";
import type {ProductionScene} from "../../spec/render-spec";
import type {SoundCue} from "../../spec/shot-contract";
import {resolveBeatShots} from "../../spec/shot-timeline";

const writeAscii = (bytes: Uint8Array, offset: number, text: string) => {
  for (let index = 0; index < text.length; index += 1) bytes[offset + index] = text.charCodeAt(index);
};
const writeU16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
const writeU32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value, true);

const toneDataUri = (frequency: number, durationMs: number, gain: number, chirp = 0) => {
  const sampleRate = 12_000;
  const samples = Math.max(1, Math.round((durationMs / 1000) * sampleRate));
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, "RIFF");
  writeU32(view, 4, 36 + samples * 2);
  writeAscii(bytes, 8, "WAVEfmt ");
  writeU32(view, 16, 16);
  writeU16(view, 20, 1);
  writeU16(view, 22, 1);
  writeU32(view, 24, sampleRate);
  writeU32(view, 28, sampleRate * 2);
  writeU16(view, 32, 2);
  writeU16(view, 34, 16);
  writeAscii(bytes, 36, "data");
  writeU32(view, 40, samples * 2);
  let phase = 0;
  for (let index = 0; index < samples; index += 1) {
    const progress = index / samples;
    const envelope = Math.min(1, progress / .08) * Math.pow(1 - progress, 2.2);
    const currentFrequency = frequency * (1 + chirp * progress);
    phase += (Math.PI * 2 * currentFrequency) / sampleRate;
    const sample = Math.sin(phase) * envelope * gain;
    view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
  }
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return `data:audio/wav;base64,${btoa(binary)}`;
};

const SOUND_SOURCES: Record<SoundCue, string> = {
  "soft-whoosh": toneDataUri(310, 180, .11, .8),
  "soft-impact": toneDataUri(120, 120, .16, -.2),
  "line-draw": toneDataUri(680, 105, .08, .5),
  "comparison-split": toneDataUri(250, 140, .11, -.35),
  "resolve-chime": toneDataUri(840, 220, .08, .25),
};

export const SoundCueTrack: React.FC<{scene: ProductionScene; fps: number}> = ({scene, fps}) => <>
  {scene.visualBeats.flatMap((beat) => resolveBeatShots(scene, beat)).map((shot) => shot.soundCue ? <Sequence
    key={shot.shotId}
    from={Math.max(0, Math.round((shot.startMs * fps) / 1000))}
    durationInFrames={Math.max(2, Math.round((280 * fps) / 1000))}
    layout="none"
  ><Audio src={SOUND_SOURCES[shot.soundCue]} volume={.15}/></Sequence> : null)}
</>;
