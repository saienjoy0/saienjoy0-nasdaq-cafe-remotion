# 朝のNASDAQカフェ 更新差分

このZIPは、元のRemotionリポジトリへ上書きする小さな更新差分です。

Gemini 3.1 TTS対応に加え、視聴者向け画面からScene番号、実測秒数、表情・画面モード名、未割当表示、音声タイムライン表記などの制作情報を除去します。

1. ZIPを展開する
2. 中身をRemotionリポジトリ直下へ上書きコピーする
3. `npm install`を実行する
4. `.env.example`を`.env.local`へコピーし、新しく発行した`GEMINI_API_KEY`を設定する
5. `docs/08_gemini_tts_runbook.md`に従って音声を生成する

APIキー、生成済みキャッシュ、`node_modules`は含まれていません。
