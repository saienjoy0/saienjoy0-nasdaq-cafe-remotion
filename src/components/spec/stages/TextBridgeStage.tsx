import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const TextBridgeStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="TextBridgeStage"
    themeId="closing"
    accent={accent}
    background="linear-gradient(135deg,#081421,#132A41)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "18%", right: "18%", bottom: "27%", height: 3, borderRadius: 99, background: `linear-gradient(90deg,transparent,${accent},transparent)`})}
      {stageOrnament({left: "calc(50% - 7px)", bottom: "calc(27% - 5px)", width: 14, height: 14, borderRadius: 99, background: accent, boxShadow: `0 0 0 12px ${accent}18`})}
      {stageOrnament({left: 42, top: 34, width: 92, height: 4, background: "#D5E3EE"})}
    </>}
  >{children}</StageShellFrame>
);
