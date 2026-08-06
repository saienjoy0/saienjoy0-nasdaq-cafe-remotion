import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const DualLaneStage: React.FC<StageShellProps> = ({children, accent = stagePalette.warning, style}) => (
  <StageShellFrame
    shellId="DualLaneStage"
    accent={accent}
    background="linear-gradient(90deg,rgba(7,134,95,.08) 0 47%,rgba(248,251,253,.97) 47% 53%,rgba(186,107,0,.08) 53% 100%)"
    border="2px solid rgba(82,118,145,.30)"
    borderRadius={18}
    boxShadow="0 17px 40px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "50%", top: 34, bottom: 34, width: 2, background: `${accent}55`})}
      {stageOrnament({left: "calc(50% - 8px)", top: 22, width: 18, height: 18, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
