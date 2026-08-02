import type { EpisodeSceneV1, EpisodeV1 } from "../../schemas/episode-v1";
import type {
  EpisodeFinal,
  EpisodeSceneFinal,
} from "../../schemas/episode-final";

/**
 * Legacy compatibility component.
 *
 * Entity aliases are validation candidates only. Production display must be
 * declared as a Visual Beat, so this component intentionally renders nothing.
 */
export const ReusableEntityCue: React.FC<{
  episode: EpisodeV1 | EpisodeFinal;
  scene: EpisodeSceneV1 | EpisodeSceneFinal;
}> = () => null;
