import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const VerificationGateStage: React.FC<StageShellProps> = ({children, accent = stagePalette.warning, style}) => (
  <StageShellFrame
    shellId="VerificationGateStage"
    accent={accent}
    background="linear-gradient(90deg,rgba(7,134,95,.08) 0 50%,rgba(186,107,0,.08) 50% 100%),linear-gradient(180deg,rgba(248,251,253,.98),rgba(229,240,247,.94))"
    border={`3px solid ${accent}88`}
    borderRadius={14}
    boxShadow="0 17px 40px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 28, width: "calc(50% - 42px)", top: 24, height: 9, borderRadius: 99, background: stagePalette.positive})}
      {stageOrnament({right: 28, width: "calc(50% - 42px)", top: 24, height: 9, borderRadius: 99, background: accent})}
      {stageOrnament({left: "50%", top: 22, bottom: 24, width: 2, background: "rgba(82,118,145,.28)"})}
    </>}
  >{children}</StageShellFrame>
);
