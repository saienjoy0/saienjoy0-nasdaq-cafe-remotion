# Visual Grammar Technical A/B Requests

このディレクトリのJSONは、`2099-02-02`技術fixtureについて、同一台本・同一字幕・同一数字・同一出典・同一2ブロック音声を使い、Stage Shellの有無だけを比較するA/B Previewを明示的に起動する。

- repository ownerによるmainへのpushだけを受理する。
- source fixtureとTTS inputのSHA-256を固定する。
- Gemini APIを呼ばず、承認済みcacheだけを使う。
- 通常Preview、実日制作、finalへ昇格しない。
- `productionEligible`と`finalAuthorized`は常に`false`。
- 結果は`visual-grammar-ab-technical-state/outcomes/`へ記録する。
