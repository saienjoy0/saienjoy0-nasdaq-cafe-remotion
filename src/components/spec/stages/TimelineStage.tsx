import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const TimelineStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="TimelineStage"
    accent={accent}
    background="linear-gradient(180deg,rgba(248,251,253,.98),rgba(226,238,246,.94))"
    border={`2px solid ${accent}55`}
    borderRadius={14}
    style={style}
    ornaments={<>
      {stageOrnament({left: 60, right: 60, top: "52%", height: 5, borderRadius: 99, background: `${accent}88`})}
      {stageOrnament({left: "18%", top: "calc(52% - 8px)", width: 20, height: 20, borderRadius: 99, background: accent, boxShadow: `0 0 0 7px ${accent}20`})}
      {stageOrnament({left: "50%", top: "calc(52% - 8px)", width: 20, height: 20, borderRadius: 99, background: accent, boxShadow: `0 0 0 7px ${accent}20`})}
      {stageOrnament({right: "18%", top: "calc(52% - 8px)", width: 20, height: 20, borderRadius: 99, background: accent, boxShadow: `0 0 0 7px ${accent}20`})}
    </>}
  >{children}</StageShellFrame>
);
