import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const DocumentMediaStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="DocumentMediaStage"
    accent={accent}
    background="linear-gradient(145deg,#111b25,#243543)"
    border="8px solid rgba(255,255,255,.08)"
    borderRadius={12}
    boxShadow="inset 0 0 0 2px rgba(255,255,255,.10),0 20px 48px rgba(0,0,0,.32)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 24, top: 22, width: 70, height: 5, borderRadius: 99, background: accent})}
      {stageOrnament({right: 24, bottom: 20, width: 126, height: 2, background: "rgba(255,255,255,.32)"})}
    </>}
  >{children}</StageShellFrame>
);
