import type {
  PublicArrow,
  PublicMainContent,
  PublicMotionInstruction,
  PublicNode,
} from "../../../spec/public-view-model";
import {SafeCameraViewport} from "../SafeCameraViewport";
import {palette, SafeContent} from "../StageSafeArea";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const CAUSAL_FOCUS_PRESETS = new Set(["focus-ring", "dim-others"]);

export const motionProgressAt = (
  sceneTimeMs: number,
  instruction: PublicMotionInstruction | null,
  fallbackStartedAtMs: number,
  fallbackDurationMs: number,
) => {
  const startedAtMs = instruction?.startedAtMs ?? fallbackStartedAtMs;
  const durationMs = instruction?.durationMs ?? fallbackDurationMs;
  const progress = clamp((sceneTimeMs - startedAtMs) / Math.max(1, durationMs));
  if (instruction?.easing === "linear") return progress;
  if (instruction?.easing === "smooth-out") return 1 - ((1 - progress) ** 3);
  return progress * progress * (3 - 2 * progress);
};

export const isCausalFocusNode = (node: PublicNode) =>
  node.highlighted &&
  node.highlightMotion !== null &&
  CAUSAL_FOCUS_PRESETS.has(node.highlightMotion.preset);

export const causalFocusProgress = (
  sceneTimeMs: number,
  node: PublicNode,
) => {
  if (!isCausalFocusNode(node)) return 0;
  if (node.unhighlightMotion) {
    return 1 - motionProgressAt(
      sceneTimeMs,
      node.unhighlightMotion,
      node.highlightedAtMs ?? sceneTimeMs,
      180,
    );
  }
  return motionProgressAt(
    sceneTimeMs,
    node.highlightMotion,
    node.highlightedAtMs ?? sceneTimeMs,
    200,
  );
};

export const causalTraceProgress = (
  sceneTimeMs: number,
  arrow: PublicArrow,
) => arrow.enterMotion?.preset === "draw-line"
  ? motionProgressAt(sceneTimeMs, arrow.enterMotion, arrow.revealAtMs, 480)
  : 0;

const latestFocusedNode = (nodes: PublicNode[]) => [...nodes]
  .filter(isCausalFocusNode)
  .sort((a, b) => (b.highlightedAtMs ?? 0) - (a.highlightedAtMs ?? 0))[0] ?? null;

export const CausalVisualEventOverlay: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  if (!shot || shot.shotRecipe !== "causal-build") return null;

  const orderedNodeIds = content.templateConfig.nodeOrder.length > 0
    ? content.templateConfig.nodeOrder
    : content.nodes.map((node) => node.key);
  if (orderedNodeIds.length === 0) return null;

  const focusedNode = latestFocusedNode(content.nodes);
  const focusProgress = focusedNode
    ? causalFocusProgress(content.sceneTimeMs, focusedNode)
    : 0;
  const hasTrace = content.arrows.some((arrow) => causalTraceProgress(content.sceneTimeMs, arrow) > 0);
  if (focusProgress <= 0 && !hasTrace) return null;

  const dimsOthers = focusedNode?.highlightMotion?.preset === "dim-others";

  return <div
    data-causal-visual-event-overlay="true"
    style={{position: "absolute", inset: 0, zIndex: 42, pointerEvents: "none", overflow: "hidden", borderRadius: 30}}
  >
    <SafeContent style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <SafeCameraViewport shot={shot}>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, orderedNodeIds.length)},minmax(0,1fr))`,
          gap: 42,
          alignItems: "center",
        }}>
          {orderedNodeIds.map((nodeId, index) => {
            const isFocused = focusedNode?.key === nodeId;
            const fromId = nodeId;
            const toId = orderedNodeIds[index + 1];
            const arrow = toId
              ? content.arrows.find((item) => item.fromKey === fromId && item.toKey === toId) ?? null
              : null;
            const traceProgress = arrow
              ? causalTraceProgress(content.sceneTimeMs, arrow)
              : 0;
            return <div key={nodeId} style={{position: "relative", minWidth: 0, minHeight: 186}}>
              {isFocused ? <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                border: `4px solid ${palette.warning}`,
                opacity: focusProgress,
                transform: `scale(${0.985 + focusProgress * 0.03})`,
                boxShadow: dimsOthers
                  ? `0 0 0 9999px rgba(5,12,28,${0.16 * focusProgress}), 0 0 ${Math.round(24 * focusProgress)}px rgba(255,199,74,.44)`
                  : `0 0 ${Math.round(24 * focusProgress)}px rgba(255,199,74,.44)`,
              }}/> : null}
              {arrow && traceProgress > 0 ? <div style={{
                position: "absolute",
                left: "100%",
                top: "50%",
                width: 42,
                height: 6,
                background: palette.warning,
                transform: `scaleX(${traceProgress})`,
                transformOrigin: "0 50%",
                boxShadow: "0 0 16px rgba(255,199,74,.62)",
              }}>
                <div style={{
                  position: "absolute",
                  right: -1,
                  top: -7,
                  width: 0,
                  height: 0,
                  opacity: clamp((traceProgress - 0.7) / 0.3),
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderLeft: `15px solid ${palette.warning}`,
                }}/>
              </div> : null}
            </div>;
          })}
        </div>
      </SafeCameraViewport>
    </SafeContent>
  </div>;
};
