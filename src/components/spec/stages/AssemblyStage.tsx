import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const AssemblyStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="AssemblyStage"
    accent={accent}
    background={`radial-gradient(circle at 50% 52%,${accent}18 0 13%,transparent 14%),radial-gradient(circle at 50% 52%,transparent 0 31%,${accent}18 32% 32.5%,transparent 33%),linear-gradient(145deg,rgba(248,251,253,.98),rgba(228,239,246,.95))`}
    border={`2px solid ${accent}66`}
    borderRadius={24}
    boxShadow="0 19px 44px rgba(0,0,0,.22)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "18%", top: "26%", width: 12, height: 12, borderRadius: 99, background: accent})}
      {stageOrnament({right: "18%", top: "26%", width: 12, height: 12, borderRadius: 99, background: accent})}
      {stageOrnament({left: "18%", bottom: "22%", width: 12, height: 12, borderRadius: 99, background: accent})}
      {stageOrnament({right: "18%", bottom: "22%", width: 12, height: 12, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
