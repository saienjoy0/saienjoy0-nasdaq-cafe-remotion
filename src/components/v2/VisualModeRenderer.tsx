import type {CSSProperties, ReactNode} from "react";
import {interpolate, useCurrentFrame} from "remotion";
import type {EpisodeSceneV1, VisualMode} from "../../schemas/episode-v1";
import type {EpisodeSceneFinal} from "../../schemas/episode-final";
import {colors} from "../../styles/theme";

type VisualScene = EpisodeSceneV1 | EpisodeSceneFinal;

const panel: CSSProperties = {
  background: "rgba(6,16,29,.88)",
  outline: `2px solid ${colors.line}`,
  borderRadius: 18,
  boxShadow: "0 18px 60px rgba(0,0,0,.25)",
};

const MetricGrid: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, scene.supportingTexts.length))}, minmax(0, 1fr))`,
      gap: 18,
      height: "100%",
    }}
  >
    {scene.supportingTexts.map((text, index) => (
      <div
        key={`${index}-${text}`}
        style={{
          ...panel,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px 26px",
          minWidth: 0,
        }}
      >
        <div style={{color: colors.cyan, fontSize: 22, fontWeight: 900}}>
          0{index + 1}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: scene.supportingTexts.length > 3 ? 27 : 34,
            fontWeight: 900,
            lineHeight: 1.3,
            overflowWrap: "anywhere",
          }}
        >
          {text}
        </div>
      </div>
    ))}
  </div>
);

const ConclusionCard: React.FC<{scene: VisualScene}> = ({scene}) => {
  const quoted = scene.visualInstructions.match(/「([^」]+)」/)?.[1];
  const steps = quoted?.split("→").map((item) => item.trim()) ?? scene.supportingTexts;
  return (
    <div style={{...panel, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: 32}}>
      {steps.map((step, index) => (
        <div key={`${index}-${step}`} style={{display: "flex", alignItems: "center"}}>
          <div style={{padding: "24px 28px", borderRadius: 16, background: `${index === steps.length - 1 ? colors.amber : colors.cyan}1A`, outline: `2px solid ${index === steps.length - 1 ? colors.amber : colors.cyan}77`, fontSize: 31, fontWeight: 900, textAlign: "center"}}>
            {step}
          </div>
          {index < steps.length - 1 ? <div style={{paddingLeft: 18, color: colors.cyan, fontSize: 44}}>→</div> : null}
        </div>
      ))}
    </div>
  );
};

const TimelinePanel: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div style={{...panel, height: "100%", padding: "28px 30px"}}>
    <div style={{display: "flex", alignItems: "center", gap: 12}}>
      {scene.supportingTexts.map((text, index) => (
        <div
          key={`${index}-${text}`}
          style={{display: "flex", alignItems: "center", flex: 1, minWidth: 0}}
        >
          <div
            style={{
              flex: 1,
              minHeight: 116,
              display: "grid",
              placeItems: "center",
              padding: "18px 20px",
              textAlign: "center",
              borderRadius: 14,
              background: index % 2 === 0 ? `${colors.amber}1C` : `${colors.cyan}18`,
              outline: `2px solid ${index % 2 === 0 ? colors.amber : colors.cyan}66`,
              fontSize: 27,
              fontWeight: 900,
              lineHeight: 1.3,
              overflowWrap: "anywhere",
            }}
          >
            {text}
          </div>
          {index < scene.supportingTexts.length - 1 ? (
            <div style={{padding: "0 10px", color: colors.cyan, fontSize: 40}}>→</div>
          ) : null}
        </div>
      ))}
    </div>
    {scene.timelineBasis ? (
      <div style={{marginTop: 24, color: colors.muted, fontSize: 22, lineHeight: 1.45}}>
        時系列の根拠：{scene.timelineBasis}
      </div>
    ) : null}
  </div>
);

const ExpectedActualGap: React.FC<{scene: VisualScene}> = ({scene}) => {
  const basis = scene.expectedBasis;
  if (!basis) {
    throw new Error(`${scene.id}にExpected / Actual / Gapの根拠がありません`);
  }
  const columns = [
    {label: "市場の予想", value: basis.expected, note: basis.category},
    {label: "実際に出た材料", value: basis.actual, note: basis.concreteBasis},
    {label: "今回のずれ", value: basis.gap, note: basis.attribution},
  ];
  return (
    <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, height: "100%"}}>
      {columns.map((column, index) => (
        <div key={column.label} style={{...panel, padding: "24px 26px", minWidth: 0}}>
          <div style={{color: index === 0 ? colors.amber : colors.cyan, fontSize: 22, fontWeight: 900, letterSpacing: ".1em"}}>
            {column.label}
          </div>
          <div style={{marginTop: 14, fontSize: 29, fontWeight: 900, lineHeight: 1.35, overflowWrap: "anywhere"}}>
            {column.value}
          </div>
          <div style={{marginTop: 16, color: colors.muted, fontSize: 20, lineHeight: 1.45, overflowWrap: "anywhere"}}>
            {column.note}
          </div>
        </div>
      ))}
    </div>
  );
};

const CausalDiagram: React.FC<{scene: VisualScene}> = ({scene}) => {
  const quoted = scene.visualInstructions.match(/「([^」]+)」/)?.[1];
  const nodes = quoted?.split("→").map((item) => item.trim()) ?? scene.supportingTexts;
  return (
    <div style={{...panel, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 26}}>
      {nodes.map((node, index) => (
        <div key={`${index}-${node}`} style={{display: "flex", alignItems: "center", minWidth: 0}}>
          <div style={{padding: "20px 16px", borderRadius: 14, background: `${index % 2 === 0 ? colors.cyan : colors.amber}1A`, outline: `2px solid ${index % 2 === 0 ? colors.cyan : colors.amber}66`, fontSize: 25, fontWeight: 900, textAlign: "center", overflowWrap: "anywhere"}}>
            {node}
          </div>
          {index < nodes.length - 1 ? <div style={{padding: "0 8px", color: colors.cyan, fontSize: 34}}>→</div> : null}
        </div>
      ))}
    </div>
  );
};

const StockComparison: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, height: "100%"}}>
    {scene.supportingTexts.map((text, index) => (
      <div key={`${index}-${text}`} style={{...panel, display: "grid", placeItems: "center", padding: 20, color: index % 3 === 2 ? colors.amber : colors.text, fontSize: 30, fontWeight: 900, textAlign: "center", overflowWrap: "anywhere"}}>
        {text}
      </div>
    ))}
  </div>
);

const VerificationPoints: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, scene.supportingTexts.length))}, minmax(0, 1fr))`,
      gap: 16,
      height: "100%",
    }}
  >
    {scene.supportingTexts.map((text, index) => (
      <div
        key={`${index}-${text}`}
        style={{
          ...panel,
          minWidth: 0,
          display: "grid",
          gridTemplateRows: "auto auto 1fr 1fr",
          gap: 12,
          padding: "22px 22px 20px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: `${index === 0 ? colors.amber : colors.cyan}22`,
            outline: `2px solid ${index === 0 ? colors.amber : colors.cyan}`,
            color: index === 0 ? colors.amber : colors.cyan,
            fontSize: 23,
            fontWeight: 900,
          }}
        >
          {index + 1}
        </div>
        <div style={{fontSize: 28, fontWeight: 900, lineHeight: 1.25}}>
          {text.replace(/^[①②③④⑤⑥⑦⑧⑨]/, "")}
        </div>
        <div
          style={{
            alignSelf: "stretch",
            padding: "12px 14px",
            borderRadius: 12,
            background: `${colors.cyan}14`,
            outline: `1px solid ${colors.cyan}55`,
          }}
        >
          <div style={{color: colors.cyan, fontSize: 17, fontWeight: 900}}>
            強まる条件
          </div>
          <div style={{marginTop: 5, fontSize: 20, fontWeight: 800}}>
            中心仮説と整合する動きが継続
          </div>
        </div>
        <div
          style={{
            alignSelf: "stretch",
            padding: "12px 14px",
            borderRadius: 12,
            background: `${colors.amber}14`,
            outline: `1px solid ${colors.amber}55`,
          }}
        >
          <div style={{color: colors.amber, fontSize: 17, fontWeight: 900}}>
            弱まる条件
          </div>
          <div style={{marginTop: 5, fontSize: 20, fontWeight: 800}}>
            逆行する反応、または新材料
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TextPanel: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div style={{...panel, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 36}}>
    <div style={{fontSize: 46, fontWeight: 900, lineHeight: 1.3}}>{scene.headline}</div>
    <div style={{marginTop: 28, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap"}}>
      {scene.supportingTexts.slice(0, 3).map((text) => (
        <div key={text} style={{padding: "14px 20px", borderRadius: 14, background: `${colors.cyan}16`, outline: `1px solid ${colors.cyan}66`, color: colors.text, fontSize: 24, fontWeight: 800, lineHeight: 1.35}}>
          {text}
        </div>
      ))}
    </div>
  </div>
);

const NewsMediaPanel: React.FC<{scene: VisualScene}> = ({scene}) => (
  <div
    style={{
      ...panel,
      height: "100%",
      display: "grid",
      gridTemplateColumns: "0.8fr 1.2fr",
      gap: 24,
      padding: 26,
    }}
  >
    <div
      style={{
        minWidth: 0,
        borderRadius: 15,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        background: "repeating-linear-gradient(135deg, rgba(20,207,255,.08) 0 14px, rgba(3,7,17,.72) 14px 28px)",
        outline: `2px dashed ${colors.cyan}66`,
        padding: 24,
      }}
    >
      <div>
        <div style={{color: colors.amber, fontSize: 20, fontWeight: 900, letterSpacing: ".08em"}}>
          海外市場ニュース
        </div>
        <div style={{marginTop: 18, color: colors.text, fontSize: 33, fontWeight: 900}}>
          {scene.name}
        </div>
        <div style={{marginTop: 12, color: colors.muted, fontSize: 21, lineHeight: 1.4}}>
          Reuters報道から要点を整理
        </div>
      </div>
    </div>
    <div style={{minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center"}}>
      <div style={{color: colors.cyan, fontSize: 19, fontWeight: 900}}>
        報道で確認できた3点
      </div>
      <div style={{marginTop: 10, fontSize: 31, fontWeight: 900, lineHeight: 1.3}}>
        {scene.headline}
      </div>
      <div style={{marginTop: 16, display: "grid", gap: 9}}>
        {scene.supportingTexts.slice(0, 3).map((text, index) => (
          <div
            key={`${index}-${text}`}
            style={{
              display: "grid",
              gridTemplateColumns: "34px 1fr",
              gap: 10,
              alignItems: "center",
              padding: "9px 12px",
              borderRadius: 10,
              background: "rgba(3,7,17,.62)",
              fontSize: 21,
              fontWeight: 800,
            }}
          >
            <span style={{color: colors.cyan}}>0{index + 1}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ChartPanel: React.FC<{scene: VisualScene}> = ({scene}) => {
  const values = scene.numbers
    .flatMap((value) => value.split("、"))
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && !value.startsWith("なし"));
  return (
    <div style={{...panel, height: "100%", padding: 26, display: "flex", flexDirection: "column", justifyContent: "center"}}>
      <div style={{color: colors.cyan, fontSize: 21, fontWeight: 900}}>市場の数字</div>
      <div style={{marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14}}>
        {values.slice(0, 6).map((value, index) => (
          <div key={`${index}-${value}`} style={{padding: "18px 16px", borderRadius: 13, background: index % 2 === 0 ? `${colors.cyan}14` : `${colors.amber}14`, outline: `1px solid ${index % 2 === 0 ? colors.cyan : colors.amber}55`, fontSize: 25, fontWeight: 900, textAlign: "center", lineHeight: 1.3}}>
            {value}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderMode = (mode: VisualMode, scene: VisualScene): ReactNode => {
  switch (mode) {
    case "結論カード":
      return <ConclusionCard scene={scene} />;
    case "数字比較":
      return <MetricGrid scene={scene} />;
    case "Expected / Actual / Gap":
      return <ExpectedActualGap scene={scene} />;
    case "タイムライン":
      return <TimelinePanel scene={scene} />;
    case "因果図・供給網図":
      return <CausalDiagram scene={scene} />;
    case "銘柄比較":
      return <StockComparison scene={scene} />;
    case "検証ポイント":
      return <VerificationPoints scene={scene} />;
    case "テキスト中心表示":
      return <TextPanel scene={scene} />;
    case "ニュース映像":
      return <NewsMediaPanel scene={scene} />;
    case "チャート":
      return <ChartPanel scene={scene} />;
  }
};

export const resolveActiveVisualModeIndex = ({
  frame,
  durationInFrames,
  modeCount,
}: {
  frame: number;
  durationInFrames: number;
  modeCount: number;
}) => {
  if (durationInFrames <= 0 || modeCount <= 0) {
    throw new Error("画面モード切り替えには正のScene尺と1件以上のモードが必要です");
  }
  const safeFrame = Math.max(0, Math.min(durationInFrames - 1, Math.floor(frame)));
  return Math.min(
    modeCount - 1,
    Math.floor((safeFrame * modeCount) / durationInFrames),
  );
};

export const resolveActiveVisualMode = (
  scene: VisualScene,
  frame: number,
) =>
  scene.visualModes[
    resolveActiveVisualModeIndex({
      frame,
      durationInFrames: scene.durationInFrames,
      modeCount: scene.visualModes.length,
    })
  ];

export const VisualModeRenderer: React.FC<{scene: VisualScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const activeModeIndex = resolveActiveVisualModeIndex({
    frame,
    durationInFrames: scene.durationInFrames,
    modeCount: scene.visualModes.length,
  });
  const activeMode = scene.visualModes[activeModeIndex];
  const activeModeStartFrame = Math.ceil(
    (activeModeIndex * scene.durationInFrames) / scene.visualModes.length,
  );
  const modeOpacity = interpolate(
    frame - activeModeStartFrame,
    [0, 8],
    [0.35, 1],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <div style={{height: "100%", minHeight: 0}}>
      <div style={{minHeight: 0, opacity: modeOpacity}}>{renderMode(activeMode, scene)}</div>
    </div>
  );
};
