import {Audio} from "@remotion/media";
import {staticFile} from "remotion";

export const SceneAudio: React.FC<{src: string}> = ({src}) => (
  <Audio src={staticFile(src)} />
);
