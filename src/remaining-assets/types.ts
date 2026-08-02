export type RemainingAssetType = "person" | "person_role" | "concept" | "background";

export type RemainingAsset = {
  asset_id: string;
  priority: "A" | "B" | "C";
  asset_type: RemainingAssetType;
  display_name: string;
  ticker_or_person: string;
  category: string;
  main_subject: string;
  support_1: string;
  support_2: string;
  beginner_message: string;
  avoid_misunderstanding: string;
  composition: string;
  source_policy: string;
  output_filename: string;
  prompt_id: string;
  status: string;
};

export type PersonPresentation = {
  japaneseName: string;
  role: string;
  organization: string;
  aliases: string[];
  sourcePage: string;
  portraitPath?: string;
  sourceStatus: "official-photo" | "official-photo-pending" | "institution-card";
};
