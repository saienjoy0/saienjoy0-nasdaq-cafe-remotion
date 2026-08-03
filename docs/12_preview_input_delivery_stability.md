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
→ Gemini Secret存在確認
→ Node.jsとnpm ci
→ 正式validator
→ ffmpeg準備
→ Gemini TTS 2ブロック
→ Remotion preview
→ MP4・report・production data確認
→ ffprobeと全映像デコード
→ delivery_manifest.json作成
→ Artifact保存
```

入力preflightに失敗した場合、`npm ci`、ffmpeg、TTS、Remotionへ進みません。

## 禁止事項

- Action内でのBase64デコード
- Action内でのgzip展開
- JSON断片の連結
- pushやpull requestによる日次レンダー自動起動
- 一時的な復元workflow
- SHA不明の入力でのpreview開始
- Artifactの期限付きURLだけを最終納品物として扱うこと
- preview確認前のfinal実行

## 成功後の受け渡し

1. 成功Artifactを直ちにダウンロードする
2. ZIPからMP4を展開する
3. `delivery_manifest.json`とMP4のSHA-256、サイズを照合する
4. MP4が0バイトでなく、デコード確認済みであることを確認する
5. ChatGPTで渡す場合は`/mnt/data`へ納品用コピーを置き、実在確認後にリンクを渡す
6. GitHub Artifact、Release、またはユーザーのローカル環境にも長期保存用の実体を残す

`/mnt/data`は会話内の納品用コピーであり、永久保管先ではありません。

## final

workflowはpreviewだけを生成します。finalは、ユーザーがpreviewを目視確認し、明示的に依頼した場合だけ別の正式経路で実行します。
