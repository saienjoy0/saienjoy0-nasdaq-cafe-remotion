import assert from "node:assert/strict";
import specJson from "../render-specs/2026-07-31/render_spec.json";
import {renderSpecSchema} from "../src/spec/render-spec";
import {validateVisualStoryContract} from "../src/spec/validate-visual-story";

const source = renderSpecSchema.parse(specJson);
const clone = () => structuredClone(source);

validateVisualStoryContract(source, {enforceVariety: true});

{
  const value = clone();
  const beat = value.scenes[1].visualBeats.find((item) => item.visualTemplate === "diverging-stock-bars")!;
  beat.templateConfig.variant = "default";
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /templateConfig\.variant.*not registered/,
  );
}

{
  const value = clone();
  const scene = value.scenes[1];
  const beat = scene.visualBeats.find((item) => item.visualTemplate === "diverging-stock-bars")!;
  const target = beat.objectIds[0];
  scene.visualEvents = scene.visualEvents.filter((event) => !(event.action === "show" && event.targetId === target));
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /explicit sequence requires a show event/,
  );
}

{
  const value = clone();
  const scene = value.scenes[1];
  const beat = scene.visualBeats.find((item) => item.visualTemplate === "diverging-stock-bars")!;
  const number = scene.numbers.find((item) => beat.objectIds.includes(item.numberId))!;
  number.numericValue = null;
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /numericValue.*requires numericValue/,
  );
}

{
  const value = clone();
  const scene = value.scenes.find((item) => item.visualBeats.some((beat) => beat.visualTemplate === "causal-lane"))!;
  const beat = scene.visualBeats.find((item) => item.visualTemplate === "causal-lane")!;
  const arrowId = beat.objectIds.find((id) => scene.arrows.some((arrow) => arrow.arrowId === id))!;
  beat.objectIds = [arrowId, ...beat.objectIds.filter((id) => id !== arrowId)];
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /must appear after both connected nodes/,
  );
}

{
  const value = clone();
  value.scenes[0].visualBeats[0].finalHoldMs = undefined;
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /finalHoldMs must be resolved/,
  );
}

{
  const value = clone();
  const scene = value.scenes[1];
  const beat = scene.visualBeats.find((item) => item.visualTemplate === "diverging-stock-bars")!;
  const target = beat.objectIds[0];
  const show = scene.visualEvents.find((event) => event.action === "show" && event.targetId === target)!;
  show.atChunkId = scene.visualBeats[0].startChunkId;
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /explicit sequence requires a show event/,
  );
}

{
  const value = clone();
  const beat = value.scenes[1].visualBeats.find((item) => item.visualTemplate === "diverging-stock-bars")!;
  beat.sequencePolicy = "static";
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /static sequence must not contain show events/,
  );
}

{
  const value = clone();
  value.scenes[0].visualBeats[0].visualTemplate = "text-focus";
  assert.throws(
    () => validateVisualStoryContract(value, {enforceVariety: true}),
    /Scene 1 requires opening-contradiction|card count/,
  );
}

console.log("PASS: formal Visual Story validator accepts production input and rejects invalid geometry, order, timing, and variety");
