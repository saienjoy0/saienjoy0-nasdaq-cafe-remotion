# Visual Director Contract

Visual Directorは`render_spec.json`のfreeze前にだけ動く選択層です。Renderer、GitHub Actions、Shot Engineには編集判断を残しません。

```text
approved semantic render input
→ deterministic Candidate Builder
→ visual_candidate_catalog.json
→ candidateId-only Visual Direction Plan
→ deterministic compiler
→ Protected Semantic Diff
→ existing visual gates / renderer validator
→ freeze
```

## 責任境界

- Candidate Builderはニュース名や日付で分岐せず、Evidence Capability、登録済みTemplate、Visual Grammar、既存object、解決済みassetだけから合法候補を生成する。
- Visual Directorは`candidateId`だけを選ぶ。Template JSON、asset ID、数値、source IDを自由記述しない。
- Compilerは候補の存在、Beat一致、catalog SHA、render spec SHA、asset placement、Evidence不変を検証してVisual fieldだけを適用する。
- Protected Semantic Diffはnarration、caption、Scene順、数字、source、Expected / Actual / Gap、因果、反対材料、確信度を完全不変にする。
- `DECORATIVE_ASSET`、`REDUNDANT_ENTITY`、`REALITY_ANCHOR_DROUGHT`はreview warningであり、自動Template変更の理由にしない。

## Evidence Capability

`source-document`、`quote-social`、`time-series`、`comparison-set`、`gap`、`causal-graph`、`entity`、`image-media`、`verification`、`text-only`を使用する。

verified 1分足がない場合、`event-reaction-timeline / verified-series`候補は生成しない。比較Candidateは同じ単位・同じ比較基準・numericValueを要求する。source receipt / news mediaはEvidenceと解決済みplacementを要求する。企業の初回言及だけではentity候補を必須化しない。

## CLI

```bash
npm run visual-director:build -- --spec render_spec.json --hints visual_capability_hints.json --catalog visual_candidate_catalog.json
npm run visual-director:compile -- --spec render_spec.json --catalog visual_candidate_catalog.json --plan visual_direction_plan.json --output directed_render_spec.json --report visual_direction_compile_report.json
```

同じ入力は同じ順序のcatalogを生成し、planはcatalog全体のcanonical SHA-256へ固定される。
