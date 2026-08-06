import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const TextBridgeStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="TextBridgeStage"
    accent={accent}
    background="linear-gradient(135deg,rgba(248,251,253,.72),rgba(228,239,246,.38))"
    style={style}
    ornaments={<>
      {stageOrnament({left: "22%", right: "22%", bottom: "28%", height: 4, borderRadius: 99, background: `linear-gradient(90deg,transparent,${accent},transparent)`})}
      {stageOrnament({left: "calc(50% - 5px)", bottom: "calc(28% - 4px)", width: 12, height: 12, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
