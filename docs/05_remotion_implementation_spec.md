# 朝のNASDAQカフェ｜Remotion実装・音声制作仕様

作成日：2026-07-10  
文書名：`05_remotion_implementation_spec.md`  
対象：Codex、Remotion実装、TTS・字幕生成、毎朝の制作運用

---

## 0. この文書の目的

この文書は、`01_fox_character_bible.md`、`02_editorial_bible.md`、`03_episode_production_spec.md`、`04_entertainment_inquisitor.md` に従って完成した制作パッケージを、意味を変えずに音声・字幕・映像へ変換する実装仕様です。

この文書が決めるのは、次の範囲です。

- 固定背景、狐の立ち絵、BGMなどの素材配置
- 完成MDからRemotion用データを作る前処理
- TTS、音声計測、字幕同期、Scene尺の決定
- Remotionへ渡すJSONの構造
- Remotionコンポーネントと画面レイアウト
- 表情指定と実在する立ち絵の対応
- プレビュー、検証、レンダリング
- エラー時の停止条件とフォールバック
- 毎朝再現できるコマンドと運用手順

この文書は、市場因果、主役ニュース、ナレーションの意味、タイトルの内容を判断しません。

### 適用順位

判断が競合する場合は、次の順番を優先します。

1. ChatGPTプロジェクト指示
2. `02_editorial_bible.md`
3. `01_fox_character_bible.md`
4. `03_episode_production_spec.md`
5. `04_entertainment_inquisitor.md`
6. この文書
7. Remotionコード内の既存実装
8. 当日の一時的な制作メモ

実装上の都合で、1〜5で確定した意味を変更してはいけません。

---

# 1. 5人の専門家による設計結論

この仕様は、次の5つの視点を統合して決定します。

## 1.1 編集統制担当

結論：ChatGPTが制作パッケージ内で市場因果と完成ナレーションを確定し、CodexとRemotionは意味を変更しない。

保護対象：

- 主役ニュースまたは主役テーマ
- ストーリーの背骨
- Expected / Actual / Gap
- 確信度
- 重要な反対材料
- 出典主体・媒体
- 可能性表現、未確認表現
- 狐の完成ナレーション
- 大テロップ、補助テロップの意味
- Scene 1〜9の役割

## 1.2 Remotionアーキテクト

結論：毎朝新しい画面コードを作らず、9Sceneを一つのデータ駆動Compositionで描画する。

- 内容はJSON
- 見た目はReactコンポーネント
- 固定素材はasset manifest
- 毎日の生成物は日付フォルダ
- 尺はtimeline compilerで一元計算
- Compositionの長さは入力データから動的に決定

## 1.3 TTS・字幕担当

結論：Gemini TTSはScene 1〜4とScene 5〜9の2ブロックで生成し、字幕本文は制作パッケージの原文を正本とする。

- 音声認識結果で字幕本文を上書きしない
- TTS向け表記変更は読み方だけに限定する
- ブロック内の段落間無音を実測し、Chunk・Scene尺を決める
- タイムスタンプはTTS提供値または強制アライメントを優先する
- 推定字幕は品質区分を残す

## 1.4 データ・品質保証担当

結論：Codexの自由判断ではなく、固定書式、スキーマ、ハッシュ、検証ゲートで再現可能にする。

- MarkdownはASTで解析する
- 見出しが足りない場合は推測せず停止する
- 生成JSONへ元MDのSHA-256を記録する
- 音声、字幕、素材の存在をレンダー前に検証する
- 不一致を警告で流さず、重要項目は失敗させる

## 1.5 毎朝の運用・保守担当

結論：Codexは最初にパイプラインを実装し、その後は原則として固定コマンドを実行する。

毎朝の基本操作：

```bash
npm run prepare:episode -- episodes/2026-07-10/episode_package_2026-07-10.md
npm run validate:episode -- build/2026-07-10/episode_data.json
npm run preview:stills -- build/2026-07-10/episode_data.json
npm run preview:episode -- build/2026-07-10/episode_data.json
npm run render:episode -- build/2026-07-10/episode_data.json
```

Codexへ毎朝、自由形式の長い実装指示を出す運用にはしません。

---

# 2. 現在のRemotionリポジトリと移行方針

確認済みの現在地：

- プロジェクトルート：`C:\Users\81807\Desktop\tech stock inf\video\remotion`
- Node.js：22.22.2
- Remotion：4.0.487
- React / React DOM：19.2.3
- TypeScript：5.9.3
- Composition：`NasdaqCafeEpisode`
- 1920×1080、30fps
- 現在は5Scene、45秒の試作構成
- 狐は立ち絵ではなく右下の小型インラインSVG
- 背景はコード生成
- ナレーション、字幕、入力動画は未実装
- `public/`には実素材がない
- チェックポイントブランチ作成済み
- チェックポイントコミット：`c6bd8bcd145fb2a303b9f3f4376a31adf1df6a08`

移行時の原則：

1. チェックポイントを保持する
2. 既存5Sceneを一度に破壊しない
3. 9Sceneデータ駆動版を別構成として作り、検証後に本番Compositionへ昇格する
4. TTS導入前に、ダミー音声または無音データで9Scene描画を確認する
5. 音声・字幕・タイムラインを段階的に追加する

---

# 3. 全体アーキテクチャ

```text
ChatGPT
│
│ episode_package_YYYY-MM-DD.md
│ 市場因果、9Scene、完成ナレーションを確定
▼
prepare:episode
│
├─ MD書式検証
├─ Scene 1〜9の決定論的抽出
├─ displayText抽出
├─ speechText正規化
├─ TTS生成・キャッシュ利用
├─ 音声時間計測
├─ 字幕タイムコード生成
├─ 表情切り替え位置の時刻化
├─ 外部素材manifestの解決
├─ timeline compiler
└─ episode_data.json生成
▼
validate:episode
│
├─ JSONスキーマ
├─ 9Scene
├─ 元MDハッシュ
├─ 音声
├─ 字幕
├─ Scene尺
├─ 表情名
├─ 素材参照
└─ タイトル・日付等
▼
Remotion
│
├─ 固定背景
├─ 狐立ち絵
├─ 表情切り替え
├─ 各画面モード
├─ WAV再生
├─ 字幕
├─ 大・補助テロップ
├─ BGM・SE
└─ Sceneトランジション
▼
静止画プレビュー
▼
低品質プレビューMP4
▼
最終MP4
▼
ffprobeによる出力検査
```

### 重要原則

- TTS APIはRemotionコンポーネント内から呼ばない
- レンダリング中に外部Webアクセスを行わない
- Remotionは完成済みJSONとローカル素材だけを受け取る
- 市場因果をコード内で補完しない
- 存在しない素材をファイル名だけ作って参照しない

---

# 4. 役割分担

## 4.1 ChatGPT

担当：

- 主役ニュース・主役テーマの決定
- 市場因果と確信度
- Expected / Actual / Gap
- 9Sceneへの情報配置
- 狐の完成ナレーション
- 狐の意味上の表情指定
- 表情切り替え位置を示す語句
- 画面モード
- 大テロップ、補助テロップ
- 使用数字
- 画面で伝える内容
- タイトル、サムネイル、概要欄
- 04による審問と修正

担当しない：

- 実ファイル名
- 座標
- WAVの生成
- 字幕タイムコード
- Remotionコンポーネント名
- 音声の秒数
- API実行

## 4.2 Codexと前処理スクリプト

Codexは、最初に決定論的スクリプトを実装します。毎朝は、そのスクリプトを実行し、失敗した技術的箇所だけを修正します。

担当：

- MDの固定書式解析
- 読み上げ表記の正規化
- TTSアダプターの実行
- 音声ファイルの標準化
- 音声時間計測
- 字幕タイムコード生成
- Scene尺計算
- 外部素材のmanifest解決
- JSON生成と検証
- プレビューとレンダリング
- 技術的な表示不具合の修正

禁止：

- 原稿の要約
- 新しい市場解釈の追加
- 留保・出典主体の削除
- Sceneの勝手な統合や入れ替え
- 画面に合わせた原稿の短縮
- TTSの読みやすさを理由にした意味変更

## 4.3 TTSアダプター

担当：

- 指定voice、speed、provider設定で音声生成
- providerが返すタイムスタンプの保存
- APIエラーの明示

担当しない：

- 原稿修正
- 字幕本文の生成
- Scene構造の判断

## 4.4 Remotion

担当：

- JSONの描画
- ローカルWAV再生
- 字幕表示
- 狐立ち絵表示
- 表情切り替え
- 大・補助テロップ
- 数字カード、比較、図解、タイムライン
- BGM・SE
- Scene接続
- MP4生成

担当しない：

- TTS API呼び出し
- 原稿生成
- 字幕本文の書き換え
- 市場因果の判断
- 欠落情報の創作

---

# 5. ディレクトリ構造

```text
remotion/
├─ episodes/
│  └─ YYYY-MM-DD/
│     ├─ episode_package_YYYY-MM-DD.md
│     └─ media-map.json              # 任意。外部素材の明示割当
│
├─ public/
│  ├─ assets/
│  │  ├─ characters/
│  │  │  └─ fox/
│  │  │     ├─ 通常-transparent.png
│  │  │     ├─ 分析-transparent.png
│  │  │     ├─ ニヤリ-transparent.png
│  │  │     ├─ 軽い驚き-transparent.png
│  │  │     ├─ 困惑-transparent.png
│  │  │     ├─ 警戒-transparent.png
│  │  │     └─ 眠そう-transparent.png
│  │  ├─ backgrounds/
│  │  │  └─ main-background.png
│  │  ├─ logos/
│  │  ├─ bgm/
│  │  ├─ se/
│  │  └─ fonts/
│  │
│  └─ generated/
│     └─ YYYY-MM-DD/
│        ├─ audio/
│        │  ├─ scene-01.wav
│        │  └─ ... scene-09.wav
│        ├─ captions/
│        │  ├─ scene-01.json
│        │  └─ ... scene-09.json
│        └─ media/
│
├─ build/
│  └─ YYYY-MM-DD/
│     ├─ episode_data.json
│     ├─ validation-report.json
│     ├─ render-manifest.json
│     ├─ source-extract.json
│     └─ logs/
│
├─ .cache/
│  └─ tts/
│
├─ config/
│  ├─ asset-manifest.json
│  ├─ fox-expression-map.json
│  ├─ pronunciation-dictionary.json
│  ├─ tts.config.json
│  ├─ timeline.config.json
│  └─ render.config.json
│
├─ src/
│  ├─ compositions/
│  ├─ components/
│  ├─ scenes/
│  ├─ visual-modes/
│  ├─ schemas/
│  ├─ timeline/
│  ├─ styles/
│  └─ config/
│
├─ scripts/
│  ├─ prepare-episode.ts
│  ├─ parse-package.ts
│  ├─ normalize-speech.ts
│  ├─ generate-tts.ts
│  ├─ measure-audio.ts
│  ├─ align-captions.ts
│  ├─ compile-timeline.ts
│  ├─ validate-episode.ts
│  ├─ render-preview.ts
│  └─ render-episode.ts
│
└─ renders/
   └─ YYYY-MM-DD/
      ├─ preview.mp4
      ├─ final.mp4
      └─ stills/
```

### Git管理

原則としてコミットする：

- `src/`
- `scripts/`
- `config/`の秘密情報を含まない設定
- `public/assets/`の固定素材
- `episodes/`の制作パッケージ
- サンプルJSON
- テスト

原則としてGitから除外する：

- `.env.local`
- `.cache/`
- `build/`
- `public/generated/`
- `renders/`の動画・PNG
- APIレスポンスの生データ
- 一時音声

---

# 6. 狐の7表情と背景の配置

## 6.1 初回配置先

狐の7表情：

```text
public/assets/characters/fox/通常-transparent.png
public/assets/characters/fox/分析-transparent.png
public/assets/characters/fox/ニヤリ-transparent.png
public/assets/characters/fox/軽い驚き-transparent.png
public/assets/characters/fox/困惑-transparent.png
public/assets/characters/fox/警戒-transparent.png
public/assets/characters/fox/眠そう-transparent.png
```

固定背景：

```text
public/assets/backgrounds/main-background.png
```

現在の正本は上記の透過PNGです。実在する拡張子とSHA-256を`asset-manifest.json`へ記録します。

## 6.2 素材条件

狐：

- PNGまたはWebP推奨
- 背景透過推奨
- 7表情で縦横比と表示サイズをそろえる
- 画像内に不要な余白が多い場合は、一度だけ正規化版を作る
- 原本は上書きしない

背景：

- 1920×1080を推奨
- 異なる場合は`object-fit: cover`の結果を確認する
- 狐や映像枠を置く余白が背景デザインと矛盾しないか確認する

## 6.3 表情名とアセットID

意味上の表情：

```text
通常 / 分析 / ニヤリ / 軽い驚き / 困惑 / 警戒 / 眠そう
```

物理ファイルとアセットIDは`fox-expression-map.json`で接続します。

例：

```json
{
  "version": "1.0.0",
  "assets": {
    "foxNormal": "assets/characters/fox/通常-transparent.png",
    "foxAnalysis": "assets/characters/fox/分析-transparent.png",
    "foxSmirk": "assets/characters/fox/ニヤリ-transparent.png"
  },
  "expressions": {
    "通常": "foxNormal",
    "分析": "foxAnalysis",
    "ニヤリ": "foxSmirk"
  }
}
```

全7表情の正本対応は`config/fox-expression-map.json`を基準にします。

## 6.4 フォールバック

指定表情に専用素材がない場合：

1. `fox-expression-map.json`の対応素材を使用
2. `fallbackApplied: true`を生成JSONとログへ記録
3. 原稿や表情指定自体は書き換えない
4. 素材不足だけでレンダーを停止しない

---

# 7. 固定画面レイアウト

## 7.1 基本方針

- Canvas：1920×1080
- FPS：30
- 狐：原則左側の定位置
- 中央〜右側：映像・図解・数字の主表示領域
- 下部：字幕
- 大テロップ：映像枠上部または画面上部
- Sceneごとに狐の基本位置を変更しない
- 変化は表情、映像枠、テロップ、図解で作る

## 7.2 初期ゾーン

背景と立ち絵の実物確認前は、次を仮ゾーンとします。

```text
Canvas             x=0〜1920,   y=0〜1080
Safe area          左右72px、上下54px
Fox zone           x=48〜500,   y=130〜980
Content zone       x=520〜1848, y=110〜820
Headline zone      x=540〜1810, y=90〜230
Caption zone       x=170〜1750, y=850〜1015
Footer/logo zone   背景に合わせて一度だけ確定
```

実画像を配置した後、Codexは静止画を生成し、次を確認します。

- 背景の装飾と狐が重ならないか
- 狐の耳・尻尾・足が切れないか
- 映像枠と背景内の既存フレームが一致するか
- 字幕が狐や重要数字を隠さないか

確認後、座標を`src/styles/layout.ts`へ固定します。毎朝のJSONに座標を入れません。

---

# 8. 入力MDの正式契約

## 8.1 正本

人間向けの正本は、次です。

```text
episode_package_YYYY-MM-DD.md
```

Remotion用JSONは、このMDから生成される派生成果物です。

## 8.2 固定書式

パーサーは自由な文章理解をしません。Markdown ASTを使い、固定見出しから取得します。

必須構造：

```markdown
# 朝のNASDAQカフェ｜YYYY-MM-DD 制作パッケージ

## A. エピソード概要
...

## B. Scene 1〜9

### Scene 1｜寝ている間に何が起きた？

#### 目的
...

#### 目安時間
...

#### 因果の対象
...

#### 狐の演技意図
...

#### 狐の表情
分析

#### 表情切り替え
「市場が見ていたのは」の直前で、通常から分析

#### 画面モード
結論カード

#### 前後の接続文
...

#### ナレーション
...

#### ナレーションで示す出典主体・媒体
...

#### 大テロップ
...

#### 補助テロップ
...

#### 使用する数字
...

#### 画面で見せる内容
...

#### 根拠
...

#### 不確実性
...
```

Scene 2〜9も同じ固定見出しを使用します。

## 8.3 パーサー規則

- 正規表現だけで全文を解析しない
- Markdown ASTの見出し階層で取得する
- Scene番号は1〜9を一度ずつ要求する
- Scene名の表記ゆれを番号で吸収してもよいが、欠落は失敗
- `ナレーション`が空なら失敗
- 同じScene番号が重複したら失敗
- 未知の表情名は失敗または明示的フォールバック
- 未知の画面モードは失敗
- 見つからない内容を周辺文章から推測しない

## 8.4 解析結果

内部確認用に、次を生成します。

```text
build/YYYY-MM-DD/source-extract.json
```

これは正本ではなく、解析結果の監査用です。

---

# 9. displayTextとspeechText

## 9.1 displayText

制作パッケージの完成ナレーションです。

用途：

- 字幕本文の正本
- 制作確認
- JSON上の表示原稿
- 元MDとの差分確認

変更禁止：

- 要約
- 語句の削除
- 可能性表現の削除
- 出典主体の削除
- 文の順番変更

## 9.2 speechText

TTSが読み間違えにくい表記へ機械変換した文章です。

許可する変換：

- NASDAQ → ナスダック
- Nasdaq Composite → ナスダック・コンポジット
- SOX → エスオーエックス
- 1.2% → 1.2パーセント
- 日付、時刻、単位の読み補助
- 人名・社名の辞書変換
- 読点の追加による間の調整

禁止：

- 意味の言い換え
- 文章の要約
- 原文にない説明追加
- 数字の丸め
- 主語の変更

## 9.3 読み方辞書

```text
config/pronunciation-dictionary.json
```

例：

```json
{
  "version": "1.0.0",
  "entries": [
    {"display": "NASDAQ", "speech": "ナスダック"},
    {"display": "SOX", "speech": "エスオーエックス"},
    {"display": "TSMC", "speech": "ティーエスエムシー"}
  ]
}
```

辞書変更はversionを上げ、TTSキャッシュの再利用判定へ含めます。

## 9.4 正規化検証

`normalize-speech.ts`は、許可された辞書・単位・句読点変換以外の差分を検出した場合、TTS実行前に停止します。

---

# 10. TTS仕様

## 10.1 Provider非依存

特定のTTS事業者は、この仕様書では固定しません。

TTSアダプターの共通インターフェース：

```ts
type TtsRequest = {
  sceneId: string;
  speechText: string;
  voiceId: string;
  speed: number;
  format: "wav";
  sampleRate: 48000;
};

type TtsResult = {
  audioPath: string;
  provider: string;
  providerRequestId?: string;
  wordTimings?: Array<{
    text: string;
    startMs: number;
    endMs: number;
  }>;
};
```

## 10.2 Provider選定条件

- 日本語が自然
- 同じ声を継続利用できる
- API利用が可能
- 商用・YouTube利用条件を確認できる
- 速度調整が可能
- WAVまたは変換可能な高品質音声
- タイムスタンプ返却が望ましい
- APIの再現性と料金を確認できる

## 10.3 2ブロック単位

Geminiは次の2回だけ呼び出します。一文、字幕、Visual Beat、Scene単位では呼び出しません。

```text
tts_scenes_01_04.wav
tts_scenes_05_09.wav
tts_narration.wav
```

利点：

- 成功ブロックをキャッシュし、失敗ブロックだけ再実行できる
- 段落間の実測無音から字幕・表情・Visual Beatの時刻を決められる
- API呼び出し回数を原則2回に固定できる

## 10.4 音声標準

最終保存形式：

```text
WAV
48kHz
16-bit PCM
mono
```

providerがMP3等を返す場合は、前処理で標準WAVへ変換します。

## 10.5 APIキー

```text
.env.local
```

- Gitへコミットしない
- JSON、ログ、public内へ書かない
- ログでは秘密値をマスクする

## 10.6 TTSキャッシュ

同じ原稿・声・設定なら再生成しません。

キャッシュキー：

```text
SHA256(
  speechText
  + provider
  + voiceId
  + speed
  + pronunciationDictionaryVersion
  + audioFormatVersion
)
```

キャッシュ：

```text
.cache/tts/<hash>/audio.wav
.cache/tts/<hash>/metadata.json
```

---

# 11. 音声時間計測

音声生成後、ローカル`ffprobe`で実測します。

保存値：

- durationMs
- sampleRate
- channels
- codec
- fileSize

次の場合は失敗：

- durationが0
- ファイルが読めない
- 標準WAVへ変換できない
- Scene原稿があるのに音声がない
- 音声長が設定上限を異常に超える

文字数から尺を推測して本番レンダーしません。

---

# 12. 字幕仕様

## 12.1 字幕本文

字幕本文は`displayText`を正本とします。

音声認識結果は、タイミング推定に使用しても、字幕本文へ採用しません。

## 12.2 タイムコード優先順位

1. TTS providerが返す単語・文タイムスタンプ
2. 元原稿と音声の強制アライメント
3. 句読点・文字重みによる時間配分
4. ASRはタイミング補助のみ

## 12.3 品質区分

各Sceneへ次のいずれかを記録します。

```text
provider-timestamp
forced-alignment
estimated
missing
```

本番デフォルト：

- `provider-timestamp`または`forced-alignment`：通過
- `estimated`：プレビュー可、本番は警告。明示オプションで許可
- `missing`：本番停止

## 12.4 字幕JSON

```json
[
  {
    "text": "昨夜のNasdaq Compositeは",
    "startMs": 0,
    "endMs": 1840
  },
  {
    "text": "1.2%上昇しました。",
    "startMs": 1840,
    "endMs": 3320
  }
]
```

## 12.5 分割基準

- 一字幕は原則1〜2行
- 一行の目安は全角18〜24文字
- 数字と単位を不自然に分割しない
- 企業名を途中で切らない
- 可能性表現を次字幕へ孤立させない
- 表示時間が短すぎる字幕を作らない
- 大テロップと同じ文章を全文重複させない

---

# 13. 表情切り替え同期

ChatGPTは秒数を指定しません。

制作パッケージ例：

```text
「市場が見ていたのは」の直前で、通常から分析
```

前処理は、字幕タイムコードから該当語句の開始時刻を探し、JSONへ変換します。

```json
{
  "atMs": 6280,
  "requestedExpression": "分析",
  "renderedAssetId": "foxAnalysis",
  "fallbackApplied": false
}
```

該当語句を一意に見つけられない場合：

- 推測して秒数を作らない
- `expression-switch-unresolved`として検証失敗
- 切り替えなしへ勝手に変更しない

---

# 14. Timeline compiler

## 14.1 設定の一元化

```text
config/timeline.config.json
```

初期値：

```json
{
  "fps": 30,
  "scenePreRollFrames": 6,
  "scenePostRollFrames": 12,
  "transitionFrames": 9,
  "endingHoldFrames": 12
}
```

## 14.2 Scene尺

```text
audioFrames = ceil(durationMs / 1000 × fps)
sceneDurationFrames = preRoll + audioFrames + postRoll
```

Scene 9のみ、必要に応じて`endingHoldFrames`を追加します。

## 14.3 Scene開始位置

トランジションで前後Sceneを重ねる場合：

```text
sceneStart[1] = 0
sceneStart[n+1]
= sceneStart[n]
+ sceneDuration[n]
- transitionFrames
```

全体尺：

```text
lastSceneStart + lastSceneDuration
```

尺の値を次へ重複記載しません。

- Composition
- Sceneコンポーネント
- レンダースクリプト
- README

timeline compilerが唯一の計算元です。

## 14.4 音声の重なり禁止

Scene音声は重ねません。

`preRoll`、`postRoll`、`transitionFrames`から、前Scene音声終了と次Scene音声開始の間が0未満になる場合は検証失敗とします。

---

# 15. Remotion用JSON

## 15.1 基本原則

- 純粋なJSON-serializable値だけを使用
- CSS座標やReact関数を入れない
- 日々変わる内容だけを入れる
- 表示に必要な意味情報を残す
- 元MDとの追跡情報を持つ

## 15.2 例

```json
{
  "schemaVersion": "1.0.0",
  "source": {
    "packagePath": "episodes/2026-07-10/episode_package_2026-07-10.md",
    "packageSha256": "...",
    "generatedAt": "2026-07-10T00:00:00.000Z"
  },
  "episode": {
    "id": "2026-07-10",
    "date": "2026-07-10",
    "title": "...",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "totalDurationInFrames": 12345
  },
  "tts": {
    "provider": "TBD",
    "voiceId": "TBD",
    "speed": 1,
    "pronunciationDictionaryVersion": "1.0.0"
  },
  "assets": {
    "backgroundId": "mainBackground",
    "foxExpressionMapVersion": "1.0.0",
    "bgmId": null
  },
  "scenes": [
    {
      "id": "scene-01",
      "number": 1,
      "name": "寝ている間に何が起きた？",
      "startFrame": 0,
      "durationInFrames": 780,
      "causalScope": "NASDAQ全体",
      "performanceIntent": "結論を直接伝える",
      "narration": {
        "displayText": "...",
        "speechText": "...",
        "audioSrc": "generated/2026-07-10/audio/scene-01.wav",
        "durationMs": 25200
      },
      "captions": {
        "src": "generated/2026-07-10/captions/scene-01.json",
        "quality": "provider-timestamp"
      },
      "fox": {
        "initialExpression": "分析",
        "switches": []
      },
      "visual": {
        "mode": "結論カード",
        "headline": "昨夜の結論",
        "supportingTexts": [],
        "numbers": [],
        "mediaId": null
      },
      "sourceAttribution": [],
      "uncertainty": []
    }
  ]
}
```

## 15.3 追跡情報

次を必須にします。

- schemaVersion
- packagePath
- packageSha256
- generatedAt
- pronunciationDictionaryVersion
- foxExpressionMapVersion
- TTS設定

元MDが変更された後、古いJSONでレンダーしようとした場合は停止します。

---

# 16. 外部画像・動画素材

## 16.1 必須にしない

すべてのSceneは、外部画像やニュース映像がなくても、次だけで成立させます。

- 結論カード
- 数字比較
- テキスト
- 因果図
- タイムライン
- 銘柄比較
- 検証ポイント

外部素材不足を理由に、動画全体を止めません。

## 16.2 media-map.json

外部素材を使用する場合は、明示的に割り当てます。

```json
{
  "version": "1.0.0",
  "items": [
    {
      "mediaId": "meta-ir-chart-01",
      "path": "generated/2026-07-10/media/meta-ir-chart-01.png",
      "type": "image",
      "source": "Meta IR",
      "allowedScenes": [3, 4]
    }
  ]
}
```

## 16.3 Codexの素材割当

Codexが素材を割り当てる場合：

- 実在するmanifest内素材だけを使用
- どのSceneに使ったかログへ残す
- 内容が一致しない素材は使わない
- 不足時は汎用表示へフォールバック
- レンダリング中にWebから取得しない

---

# 17. Remotionコンポーネント構造

```text
NasdaqCafeEpisode
├─ BackgroundLayer
├─ EpisodeTimeline
│  └─ SceneRenderer
│     ├─ FoxLayer
│     ├─ ContentFrame
│     ├─ VisualModeRenderer
│     ├─ HeadlineLayer
│     ├─ SupportingTextLayer
│     ├─ CaptionLayer
│     └─ SceneAudio
├─ BgmLayer
├─ GlobalLogoLayer
└─ EndingHold
```

## 17.1 VisualModeRenderer

画面モードとコンポーネント：

```text
結論カード             → ConclusionCard
数字比較               → NumberComparison
Expected / Actual / Gap → ExpectedActualGap
タイムライン           → TimelinePanel
チャート               → ChartPanel
因果図・供給網図       → CausalDiagram
銘柄比較               → StockComparison
ニュース映像           → NewsMediaPanel
検証ポイント           → VerificationPoints
テキスト中心表示       → TextPanel
```

未知の画面モードを`TextPanel`へ黙って変換しません。検証で停止します。

## 17.2 現在の5Sceneコード

既存の5Sceneは参考実装として残し、本番9Sceneへ直接継ぎ足しません。

- 再利用できるカード・背景・アニメーションを抽出
- 市場内容に依存した固定Scene構造は廃止
- 右下`FoxBadge`は本番の立ち絵表示へ置き換える
- 現在のSVG狐は、必要ならロゴまたはフォールバックとして保持

---

# 18. 音声・BGM・SE

## 18.1 ナレーション優先

- 狐の声が常に最優先
- BGMで単語が聞き取れない状態を作らない
- Scene切り替えSEを毎回入れない
- 警告音や派手な効果音を市場因果の代わりにしない

## 18.2 初期BGM方針

BGM素材が確定するまでは、BGMなしでも正常にレンダー可能にします。

BGMを追加する場合：

- 全編同一BGMを基本
- 冒頭と終了でフェード
- ナレーション中は低音量
- Sceneごとの曲変更は行わない

## 18.3 音声欠落

- Scene音声欠落：本番停止
- BGM欠落：警告のみ、BGMなしで続行
- SE欠落：警告のみ、SEなしで続行

---

# 19. 検証ゲート

## 19.1 prepare前

- 入力MDが存在する
- 対象日がファイル名と本文で一致
- Scene 1〜9が存在
- ナレーションが空でない
- 固定素材manifestが読める
- `.env.local`が必要な場合のみ存在確認

## 19.2 TTS後

- 9本の音声が存在
- すべてduration > 0
- 標準形式へ変換済み
- TTSキャッシュ情報が一致
- 原稿と音声設定のハッシュを記録

## 19.3 字幕後

- すべての字幕がScene音声内に収まる
- startMs < endMs
- 字幕同士が異常に逆転しない
- 本文がdisplayTextの順番と一致
- caption qualityを記録

## 19.4 JSON後

- schemaVersion対応
- Scene数9
- startFrameとdurationが負でない
- Scene順が1〜9
- 全体尺と最終Scene終端が一致
- 表情名が規定一覧内
- 画面モードが規定一覧内
- 元MDハッシュ一致
- 素材パスが存在

## 19.5 レンダー後

- MP4が存在
- durationが計算値と大きくずれていない
- 1920×1080
- 30fps
- H.264 / AACを基本
- 互換性の高いピクセル形式を目標とする
- 音声トラックが存在
- 黒画面・ブラウザエラー・欠落素材ログがない

既存出力で検出されたピクセル形式との差は、再生不能でなければ警告とし、最終的な互換性テストで判断します。

---

# 20. 停止条件とフォールバック

## 20.1 必ず停止

- Sceneが9個ない
- ナレーション欠落
- 元MDハッシュ不一致
- TTS音声欠落
- 音声時間取得不能
- JSONスキーマ違反
- Scene尺より音声が長い
- 表情切り替え語句を解決できない
- 未知の画面モード
- 必須固定背景がない

## 20.2 フォールバックして続行

- 専用の表情画像がない
- 外部ニュース映像がない
- チャート画像がない
- BGMがない
- SEがない
- 任意ロゴがない

フォールバック：

- 表情 → map上の近い既存立ち絵
- ニュース映像 → テキストカード
- チャート画像 → 数字カードまたは確認済みデータによる簡易図
- BGM / SE → 無音

フォールバック内容を`validation-report.json`へ記録します。

---

# 21. コマンド設計

## 21.1 package.json scripts

```json
{
  "scripts": {
    "prepare:episode": "tsx scripts/prepare-episode.ts",
    "validate:episode": "tsx scripts/validate-episode.ts",
    "preview:stills": "tsx scripts/render-stills.ts",
    "preview:episode": "tsx scripts/render-preview.ts",
    "render:episode": "tsx scripts/render-episode.ts",
    "inspect:assets": "tsx scripts/inspect-assets.ts",
    "test:pipeline": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

## 21.2 prepare

```bash
npm run prepare:episode -- episodes/2026-07-10/episode_package_2026-07-10.md
```

行うこと：

- MD解析
- speechText生成
- TTS
- 音声計測
- 字幕
- timeline
- JSON
- validation report

## 21.3 preview

静止画：

```bash
npm run preview:stills -- build/2026-07-10/episode_data.json
```

低品質プレビュー：

```bash
npm run preview:episode -- build/2026-07-10/episode_data.json
```

プレビューは、低ビットレートまたは低解像度でもよいですが、字幕・音声同期は本番と同じデータを使用します。

## 21.4 final render

```bash
npm run render:episode -- build/2026-07-10/episode_data.json
```

本番出力：

```text
renders/2026-07-10/final.mp4
```

---

# 22. ログと追跡可能性

各日付の`build/YYYY-MM-DD/logs/`へ次を残します。

- parser.log
- speech-normalization.log
- tts.log
- caption-alignment.log
- timeline.log
- asset-resolution.log
- validation.log
- render.log

ログへ残す：

- 何を生成したか
- どのキャッシュを使ったか
- どの素材を割り当てたか
- どのフォールバックを使ったか
- 元MDハッシュ
- TTS設定
- 各Scene音声時間
- 各Scene開始・終了フレーム

ログへ残さない：

- APIキー
- 認証トークン
- 秘密情報

---

# 23. テスト

## 23.1 Parserテスト

- 正常な9Sceneを抽出できる
- Scene 4欠落で失敗
- ナレーション空で失敗
- 重複Sceneで失敗
- 見出し表記が規定外で失敗

## 23.2 Speech normalizationテスト

- 許可辞書だけ変換
- 数字を変更しない
- 可能性表現を保持
- 出典主体を保持
- 未許可の語句削除で失敗

## 23.3 Timelineテスト

- 音声長から正しいフレーム数
- トランジション重複を反映
- 音声が重ならない
- 最終尺が一致

## 23.4 Assetテスト

- 固定背景欠落で失敗
- 表情専用素材欠落でフォールバック
- 外部動画欠落でテキスト表示

## 23.5 End-to-endテスト

サンプル制作パッケージ1本から、次を自動生成できること。

- 9音声
- 9字幕
- episode_data.json
- 9Scene静止画
- プレビューMP4
- 最終MP4

---

# 24. 段階実装

一度に全機能を実装しません。

## Phase 0｜素材投入と確認

- 立ち絵2枚を配置
- 背景を配置
- `asset-manifest.json`作成
- `fox-expression-map.json`仮割当
- 静止画でレイアウト校正

完了条件：

- 画像が切れずに表示
- 背景・狐・映像枠・字幕のゾーンを固定

## Phase 1｜9Sceneデータ駆動化

- 既存5Sceneとは別に9Scene版を作る
- サンプルJSONで全画面モードを確認
- 音声なしでもScene順と表示を検証

完了条件：

- 9Sceneがデータだけで切り替わる
- Reactコードへ当日の企業名や数字を直書きしていない

## Phase 2｜MD parserとJSON

- 固定見出しparser
- schemaVersion 1.0.0
- source hash
- validation

完了条件：

- サンプルMDからJSON生成
- 欠落時に正しく停止

## Phase 3｜TTSと音声尺

- provider adapter
- speech normalization
- Scene別WAV
- ffprobe
- TTS cache
- dynamic duration

完了条件：

- 1Scene修正時に他Sceneの音声を再生成しない
- 音声が切れない

## Phase 4｜字幕と表情同期

- caption alignment
- CaptionLayer
- 表情切り替え語句の時刻化

完了条件：

- 字幕本文がMDと一致
- 表情切り替えが指定語句と一致

## Phase 5｜BGM・外部素材

- BGM
- SE
- media-map
- NewsMediaPanel
- フォールバック

完了条件：

- 素材なしでも成立
- 素材ありの場合のみ追加表示

## Phase 6｜毎朝運用

- prepare
- validate
- stills
- preview
- final render
- post-render inspection

完了条件：

- 固定コマンドで1本完成
- Codexが市場内容を判断し直さない

---

# 25. 初回実装時にCodexへ渡す原則

```text
01〜05の内容と優先順位を守ってください。
現在のチェックポイントから作業し、既存の正常状態を壊さないでください。
市場因果、ナレーション、テロップの意味を変更しないでください。

まずPhase 0だけを実施してください。
立ち絵2枚と背景の実在ファイルを確認し、public/assets配下へ整理してください。
実画像を確認せずに表情名を決めないでください。
素材manifestを作り、仮の画面へ表示し、静止画を生成してください。

この段階ではTTS、字幕、9Scene本実装、外部API接続を開始しないでください。
完了後、配置したファイル、画像寸法、透過有無、仮レイアウト、問題点だけを報告してください。
```

---

# 26. Codexが変更してよいもの・いけないもの

変更してよい：

- コンポーネント分割
- TypeScript型
- スキーマ実装
- 素材manifest
- レイアウト定数
- アニメーション実装
- エラー処理
- キャッシュ
- レンダー設定
- 技術的な字幕表示

変更してはいけない：

- 市場因果
- Sceneの意味
- 狐のナレーション
- 出典主体
- 可能性表現
- 不確実性
- 重要な反対材料
- タイトル・サムネイルの約束
- 画面都合による原稿短縮

意味変更が必要に見える場合は、実装せず不足事項として報告します。

---

# 27. 未確定項目

次は素材またはサービス確認後に一度だけ確定します。

1. 狐2枚の実際の表情対応
2. 背景に合わせた最終座標
3. TTS provider
4. voiceId
5. TTS速度
6. 字幕アライメント方式
7. BGM素材
8. 字幕フォントサイズと1行文字数の最終値
9. Sceneトランジションの具体的演出

未確定項目をCodexが勝手に最終決定しません。仮値を使う場合は、設定ファイルへ`provisional: true`を残します。

---

# 28. 完成条件

このRemotion基盤は、次をすべて満たしたとき完成とします。

- 完成MDからScene 1〜9を機械的に抽出できる
- 原稿を意味変更せずspeechTextへ変換できる
- Scene別TTSを生成またはキャッシュ利用できる
- 音声時間からScene尺を決められる
- 字幕本文がMDと一致する
- 字幕と音声が同期する
- 表情指定を2枚の実素材へ安全に割り当てられる
- 固定背景と狐の位置が全Sceneで安定する
- すべての画面モードが表示できる
- 外部素材がなくても動画が成立する
- 元MD、音声、字幕、JSONの対応をハッシュで確認できる
- 静止画、プレビュー、最終MP4を固定コマンドで生成できる
- Codexが市場因果や原稿の意味を判断し直す必要がない

---

# 29. 参照するRemotion公式仕様

- Assets / `staticFile()`：固定素材とローカル生成素材の読み込み
- `<Composition>` input props：JSON-serializableな入力データ
- `calculateMetadata()`：入力データからduration、fps、dimensionsを決定
- Captions：字幕データの表示
- Audio：ローカル音声の再生
- TransitionSeries：Scene間トランジションと尺の重複

公式ドキュメント：

- https://www.remotion.dev/docs/staticfile
- https://www.remotion.dev/docs/composition
- https://www.remotion.dev/docs/calculate-metadata
- https://www.remotion.dev/docs/captions
- https://www.remotion.dev/docs/audio/importing
- https://www.remotion.dev/docs/transitions/transitionseries

---

# 30. 最終確認

- ChatGPT、Codex、TTS、Remotionの責任が分離されているか
- Codexの毎朝の自由判断を減らしたか
- MD解析が固定書式・AST・失敗優先になっているか
- 字幕本文をASR結果で置換していないか
- Gemini TTSをScene 1〜4／Scene 5〜9の2ブロックにしたか
- 音声実測後に尺を決めているか
- Timeline計算を一か所へ集約したか
- 固定素材、生成素材、ビルド情報を分離したか
- 2枚の狐素材と7種類の意味上の表情を分離したか
- 表情フォールバックを記録しているか
- 外部素材がなくても成立するか
- 元MDハッシュを記録したか
- APIキーをGit、JSON、publicへ入れていないか
- 重要な欠落は停止し、装飾不足だけフォールバックするか
- 段階実装になっているか
- 最初はPhase 0だけを行うか
