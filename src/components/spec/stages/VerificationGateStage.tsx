import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const VerificationGateStage: React.FC<StageShellProps> = ({children, accent = stagePalette.warning, style}) => (
  <StageShellFrame
    shellId="VerificationGateStage"
    themeId="verification-gate"
    accent={accent}
    background="linear-gradient(180deg,#F7F9FA,#EAF0F3)"
    border="1px solid #B5C4CE"
    borderRadius={8}
    boxShadow="0 12px 28px rgba(16,32,51,.12)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 32, right: 32, top: 24, height: 9, borderRadius: 99, background: accent})}
      {stageOrnament({left: 44, top: 58, bottom: 34, width: 3, borderRadius: 99, background: "rgba(80,106,127,.22)"})}
    </>}
  >{children}</StageShellFrame>
);
