import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const ProgressiveChartStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="ProgressiveChartStage"
    accent={accent}
    background="linear-gradient(180deg,rgba(250,252,254,.98),rgba(232,241,247,.96))"
    border={`2px solid ${accent}66`}
    borderRadius={16}
    boxShadow="0 18px 40px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 52, right: 34, bottom: 52, height: 3, background: `${accent}66`})}
      {stageOrnament({left: 52, top: 46, bottom: 52, width: 3, background: `${accent}66`})}
      {stageOrnament({left: 52, right: 34, top: "36%", height: 1, background: "rgba(82,118,145,.18)"})}
      {stageOrnament({left: 52, right: 34, top: "66%", height: 1, background: "rgba(82,118,145,.18)"})}
    </>}
  >{children}</StageShellFrame>
);
