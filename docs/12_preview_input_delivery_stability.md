# Preview入力・動画受け渡し安定化契約

## 目的

確定済みの`render_spec.json`を分割・復元せず、一つの不変入力としてGitHub Actionsへ渡します。GitHub Actionsは入力を修理せず、検証済み入力を機械的にpreviewへ変換します。

## 本番入力

本番workflowが受け取る実行正本は、次の完全な一ファイルだけです。

```text
render-specs/YYYY-MM-DD/render_spec.json
```

Base64断片、生JSON断片、gzip、triggerファイル、一時workflowは本番入力に使用しません。

## Action実行前

1. `episode_package`、画像採用経路、`render_spec.json`を確定する
2. JSON構文、参照アセット、episode packageとの整合を確認する
3. 正式validatorを通す
4. 完全な一ファイルとしてGitHubへ登録する
5. 登録後のファイルからSHA-256を取得する
6. workflowへ対象日とSHA-256を渡す

例：

```bash
SPEC=render-specs/2026-08-03/render_spec.json
npm run episode:spec:validate -- "$SPEC"
sha256sum "$SPEC"
```

## workflow入力

- `episode_date`：`YYYY-MM-DD`
- `expected_spec_sha256`：事前確認済みのSHA-256
- `confirmation`：`PREVIEW`

入力パスはworkflow内で`episode_date`から一意に導出します。任意の`spec_path`は受け付けません。

## workflow内の順序

```text
checkout
→ 完全ファイルの存在確認
→ JSON構文確認
→ episode.id / targetDate / パス日付の一致
→ SHA-256一致
→ TTS入力SHA-256算出
→ Gemini Secret存在確認
→ Node.jsとnpm ci
→ 正式validator
→ ffmpeg準備
→ runtime stability tests
→ Gemini TTS 2ブロックのキャッシュ復元
→ Gemini TTS 2ブロック生成
→ Remotion preview
→ 映像・音声の機械検査
→ delivery_manifest.json作成
→ Artifact保存
```

入力preflightに失敗した場合、`npm ci`、ffmpeg、TTS、Remotionへ進みません。

## Gemini TTS停止防止

Gemini APIキーの切り替えと429再試行には、次の上限を適用します。

- 全キー合計の最大API試行回数：12回
- 1ブロック処理の最大経過時間：12分
- 全キーが日次上限または認証停止の場合：次回利用可能時刻を示して即時停止
- 上限到達時：`GEMINI_RETRY_BUDGET_EXHAUSTED`として停止

無制限の待機や、GitHub Actions全体のtimeoutまで待ち続ける動作は禁止します。

## 2ブロック音声キャッシュ

本番Gemini音声は次の2ブロックだけです。

- Scene 1〜4
- Scene 5〜9

キャッシュ対象は`.cache/spec-tts-blocks`です。旧`.cache/spec-tts`は本番2ブロックキャッシュとして使用しません。

キャッシュIDはrender spec全体のSHAではなく、次から作るTTS入力SHAを使用します。

- TTSモデルと音声
- `voiceProfileId`
- 発音指定
- Scene順とChunk順
- `speechText`
- 2ブロック境界

画面配置やテロップだけを変更し、音声入力が変わらない場合は、音声を再生成しません。

途中失敗時に一つ以上のブロック音声が完成している場合は、run固有のpartial cacheとして保存します。次回実行でpartial cacheを復元し、成功後に完全キャッシュへ昇格します。空のpartial cacheは保存しません。

## Preview MP4機械検査

`npm run episode:spec:inspect:preview -- render_spec.json`で、previewだけを検査します。finalは要求しません。

必須検査は次です。

- MP4が存在し、0バイトではない
- 映像ストリームが1本
- 音声ストリームが1本
- 映像がH.264 / `yuv420p`
- preview解像度がspecの50%
- fpsがspecと一致
- 音声がAAC / 48kHz / 2ch
- production timelineとMP4時間の差が許容範囲内
- 映像時間と音声時間の差が許容範囲内
- 映像と音声を最後までデコード可能
- 音声全体が機械的な完全無音ではない

この検査は破損、音声欠落、途中切断、仕様違いを判定します。字幕の見やすさ、画面配置、発音の自然さ、内容と映像の一致はユーザーがpreviewを目視確認します。

## 成功Artifact

成功時は次を保存します。

- preview MP4
- `delivery_manifest.json`
- `technical_report.json`
- `render_data.production.json`
- `preview_inspection.json`

`delivery_manifest.json`には、Run ID、commit SHA、spec SHA、TTS入力SHA、MP4 SHA、MP4サイズ、映像・音声デコード結果を記録します。

## 失敗Artifact

TTS、Remotion、MP4検査などで失敗した場合は、次の存在するファイルを保存します。

- `failure_manifest.json`
- `technical_report.json`
- `render_data.production.json`
- `preview_inspection.json`
- `tts-block-state.json`
- 生成済みTTSブロックのmetadata

`failure_manifest.json`は失敗した工程と各stepのoutcomeを記録します。APIキーそのものは記録しません。

## 禁止事項

- Action内でのBase64デコード
- Action内でのgzip展開
- JSON断片の連結
- pushやpull requestによる日次レンダー自動起動
- 一時的な復元workflow
- SHA不明の入力でのpreview開始
- 無制限のGemini再試行
- 映像だけを検査して音声検査を省略すること
- Artifactの期限付きURLだけを最終納品物として扱うこと
- preview確認前のfinal実行

## 成功後の受け渡し

1. 成功Artifactを直ちにダウンロードする
2. ZIPからMP4を展開する
3. `delivery_manifest.json`とMP4のSHA-256、サイズを照合する
4. MP4が0バイトでなく、映像・音声の全デコード確認済みであることを確認する
5. ChatGPTで渡す場合は`/mnt/data`へ納品用コピーを置き、実在確認後にリンクを渡す
6. GitHub Artifact、Release、またはユーザーのローカル環境にも長期保存用の実体を残す

`/mnt/data`は会話内の納品用コピーであり、永久保管先ではありません。

## final

workflowはpreviewだけを生成します。finalは、ユーザーがpreviewを目視確認し、明示的に依頼した場合だけ別の正式経路で実行します。
