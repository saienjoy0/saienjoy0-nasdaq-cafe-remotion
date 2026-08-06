import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const PictureBookStage: React.FC<StageShellProps> = ({children, accent = stagePalette.warning, style}) => (
  <StageShellFrame
    shellId="PictureBookStage"
    accent={accent}
    background="linear-gradient(135deg,#fffaf0,#f2e7d2)"
    border="12px solid rgba(111,78,42,.20)"
    borderRadius={8}
    boxShadow="inset 0 0 0 3px rgba(111,78,42,.13),0 16px 36px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 18, top: 18, width: 42, height: 42, borderLeft: `5px solid ${accent}`, borderTop: `5px solid ${accent}`})}
      {stageOrnament({right: 18, bottom: 18, width: 42, height: 42, borderRight: `5px solid ${accent}`, borderBottom: `5px solid ${accent}`})}
    </>}
  >{children}</StageShellFrame>
);
