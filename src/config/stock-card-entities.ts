import stockCardsJson from "../../data/stock-cards.json";
import type {ReusableEntity} from "./reusable-entity-cues";

type StockCardRecord = {
  companyName: string;
  ticker: string;
  description: string;
};

const stockCards = stockCardsJson as StockCardRecord[];

const japaneseAliases: Record<string, string[]> = {
  NVDA: ["エヌビディア"],
  MSFT: ["マイクロソフト"],
  AMZN: ["アマゾン"],
  META: ["メタ", "メタ・プラットフォームズ"],
  GOOGL: ["GOOG", "グーグル", "アルファベット"],
  AAPL: ["アップル"],
  TSLA: ["テスラ"],
  AMD: ["エーエムディー"],
  AVGO: ["ブロードコム"],
  TSM: ["TSMC", "台湾積体電路", "台湾セミコンダクター"],
  ASML: ["エーエスエムエル"],
  ARM: ["アーム"],
  MU: ["マイクロン"],
  INTC: ["インテル"],
  ORCL: ["オラクル"],
  PLTR: ["パランティア"],
  IBM: ["アイビーエム"],
  SMCI: ["スーパーマイクロ", "スーパー・マイクロ"],
  ANET: ["アリスタ", "アリスタネットワークス"],
  VRT: ["バーティブ", "ヴァーティブ"],
  CEG: ["コンステレーション・エナジー"],
  CRWD: ["クラウドストライク"],
  PANW: ["パロアルトネットワークス"],
  COIN: ["コインベース"],
  QCOM: ["クアルコム"],
  AMAT: ["アプライドマテリアルズ", "アプライド・マテリアルズ"],
  LRCX: ["ラムリサーチ", "ラム・リサーチ"],
  KLAC: ["KLA", "ケーエルエー"],
  MRVL: ["マーベル", "マーベル・テクノロジー"],
  SNPS: ["シノプシス"],
  CDNS: ["ケイデンス"],
  FTNT: ["フォーティネット"],
  ZS: ["ゼットスケーラー", "ゼット・スケーラー"],
  NET: ["クラウドフレア"],
  WDAY: ["ワークデイ"],
  INTU: ["インテュイット"],
  APP: ["アップラビン"],
  NFLX: ["ネットフリックス"],
  COST: ["コストコ"],
  MSTR: ["ストラテジー", "マイクロストラテジー"],
  JPM: ["JPモルガン", "JPモルガン・チェース"],
  GS: ["ゴールドマン・サックス"],
  "000660.KS": ["SKハイニックス", "ハイニックス"],
  "005930.KS": ["サムスン電子", "サムスン"],
  "8035.T": ["東京エレクトロン", "TEL"],
  "6857.T": ["アドバンテスト"],
  MS: ["モルガン・スタンレー"],
  BAC: ["バンク・オブ・アメリカ", "バンカメ"],
  C: ["シティグループ", "シティ"],
  WFC: ["ウェルズ・ファーゴ"],
  XOM: ["エクソンモービル", "エクソン"],
  CVX: ["シェブロン"],
  DIS: ["ディズニー"],
  ADBE: ["アドビ"],
  CRM: ["セールスフォース"],
  NOW: ["サービスナウ"],
  SHOP: ["ショッピファイ"],
  PYPL: ["ペイパル"],
  UBER: ["ウーバー"],
  ABNB: ["エアビーアンドビー"],
  RDDT: ["レディット"],
  SNOW: ["スノーフレーク"],
  DDOG: ["データドッグ"],
  DELL: ["デル", "デル・テクノロジーズ"],
};

const safeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildStockCardEntities = (
  existingEntities: ReusableEntity[],
): ReusableEntity[] => {
  const existingTickerEntities = new Map(
    existingEntities
      .filter((entity) => entity.kind === "ticker-card")
      .map((entity) => [entity.key.replace(/^ticker:/, ""), entity]),
  );
  const people = existingEntities.filter(
    (entity) => entity.kind === "official-portrait",
  );
  const tickerEntities: ReusableEntity[] = stockCards.map((card, index) => {
    const normalizedTicker = card.ticker.toLowerCase();
    const existing = existingTickerEntities.get(normalizedTicker);
    const aliases = [
      card.ticker,
      card.companyName,
      ...(japaneseAliases[card.ticker] ?? []),
      ...(existing?.aliases ?? []),
    ];

    return {
      key: `ticker:${normalizedTicker}`,
      kind: "ticker-card",
      aliases: [...new Set(aliases)],
      displayName: card.companyName,
      role: card.description,
      assetPath: `assets/nasdaq-cafe/stock-cards/${String(index + 1).padStart(
        3,
        "0",
      )}_${safeName(card.ticker)}.png`,
      accent: existing?.accent ?? "#76B900",
      maxDurationSec: existing?.maxDurationSec ?? 6,
    };
  });

  return [...tickerEntities, ...people];
};
