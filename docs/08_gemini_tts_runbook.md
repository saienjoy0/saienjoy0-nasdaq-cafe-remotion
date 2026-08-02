# Gemini 3.1 Flash TTS 運用手順

## 採用構成

- 本番: `gemini-3.1-flash-tts-preview`
- 音声: `Charon`
- 生成単位: Scene 1〜4 / Scene 5〜9の2ブロック
- Gemini出力: 24kHz / mono / PCM16
- Remotion用保存: 48kHz / mono / PCM16 WAV

ブロックごとにキャッシュします。Scene 1〜4が成功してScene 5〜9が失敗した場合は、後半ブロックだけを再実行します。一文、字幕、Visual Beat、Scene単位のGemini呼び出しは禁止です。

## 初回設定（Windows PowerShell）

Google AI Studioで新しいAPIキーを発行します。チャット、ソースコード、Gitへキーを貼らないでください。

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

`.env.local`の`GEMINI_API_KEY=`の右側に新しいキーを設定します。このファイルはGit管理対象外です。

## 生成

```powershell
npm install
npm run generate:voiceover:gemini -- render-specs/2026-07-10.json
```

日付とJSONパスは当日の`render_spec.json`へ置き換えます。`tts_scenes_01_04.wav`、`tts_scenes_05_09.wav`、結合済み`tts_narration.wav`を生成し、段落間の実測無音からChunk・字幕・Visual Beatの時刻を確定します。必要な無音境界を安全に検出できない場合は、比例配分せず停止します。

モデルと音声は番組契約です。`GEMINI_TTS_MODEL`や`GEMINI_TTS_VOICE`による本番切替は行いません。公開前に、固有名詞、数字、無音、音割れを人の耳で確認します。

## 安全運用

- APIキーをログ・JSON・動画クレジットへ書かない
- Previewモデル終了に備えて、採用済みWAVを保存する
- 無料枠へ機密情報や未公開情報を送らない
- API障害時は制作を停止し、Charonで再試行する
- VOICEVOXや別のGemini音声へ自動で切り替えない

## 公式資料

- Speech generation: https://ai.google.dev/gemini-api/docs/speech-generation
- Gemini 3.1 Flash TTS Preview: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-tts-preview
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
