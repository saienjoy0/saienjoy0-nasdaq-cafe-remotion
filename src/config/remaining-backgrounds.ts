const paths = {
  conclusion: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_conclusion.png",
  contradiction: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_contradiction.png",
  news: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_news.png",
  expected: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_expected_gap.png",
  causal: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_causal_chain.png",
  timeline: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_timeline.png",
  comparison: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_comparison.png",
  verification: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_verification.png",
  ending: "assets/nasdaq-cafe/remaining/backgrounds/background_scene_ending.png",
} as const;

export const resolveEpisodeBackground = ({
  sceneNumber,
  headline,
}: {
  sceneNumber: number;
  headline: string;
}) => {
  if (/タイムライン|時系列|発表時刻/.test(headline)) return paths.timeline;
  if (/比較|銘柄/.test(headline)) return paths.comparison;
  if (/期待|実際|差/.test(headline)) return paths.expected;
  if (/因果|供給|なぜ/.test(headline)) return paths.causal;
  if (/検証|注目|見る/.test(headline)) return paths.verification;
  return [
    paths.conclusion,
    paths.contradiction,
    paths.news,
    paths.expected,
    paths.causal,
    paths.timeline,
    paths.comparison,
    paths.verification,
    paths.ending,
  ][Math.max(0, Math.min(8, sceneNumber - 1))];
};
