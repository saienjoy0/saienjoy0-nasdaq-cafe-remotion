import {Still} from "remotion";
import {RemainingAssetStill, type RemainingAssetStillProps} from "./RemainingAssetStill";

export const RemainingAssetsRoot: React.FC = () => (
  <Still
    id="RemainingAssetStill"
    component={RemainingAssetStill}
    width={1536}
    height={864}
    defaultProps={{assetId: "concept_expected_actual_gap"} satisfies RemainingAssetStillProps}
  />
);
