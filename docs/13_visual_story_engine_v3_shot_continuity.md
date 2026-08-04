# Visual Story Engine v3 — Shot & Continuity Contract

## 目的

Visual Story Engine v2のVisual Template、Visual Event、Motion Presetを維持したまま、Visual Beatを複数のShotへ分解し、朝のNASDAQカフェを「動く資料」から「情報が画面上で発生し、次の説明へつながる動画」へ発展させる。

Remotion、GitHub Actions、Codexは市場因果、主役、数字、反対材料を判断し直さない。Shot PlanはChatGPT側で確定した`render_spec.json`だけを実行する。

## 固定シェル

次の領域はv3でも変更しない。

- 背景：早朝カフェ固定
- 狐：`left: 64, top: 176, width: 320, height: 720`
- Main Stage：`left: 416, top: 144, width: 1440, height: 648`
- 字幕：`left: 208, top: 812, width: 1664, height: 208`
- 見出し、Safe Margin、Scene順、字幕全文、TTS 2ブロック

Camera PresetはMain Stage内だけに作用し、背景、狐、字幕を動かしてはならない。

## 狐

既存7表情だけを使用する。

- 通常
- 分析
- ニヤリ
- 軽い驚き
- 困惑
- 警戒
- 眠そう

新しい立ち絵を日次生成しない。表情はScene番号や単語から推測せず、Shotへ明示する。位置・基本サイズを維持し、180msのCrossfadeで切り替える。

制約：

- 一つのSceneで表情変更は最大2回
- ニヤリは全編で最大2回
- 眠そうはScene 9だけ
- 表情はGap、矛盾、反対材料、不確実性、結論復帰に同期させる

## 5層

```text
Visual Template = 情報構造
Shot Recipe     = 構図と進行
Motion Preset   = 個別要素の動き
Camera Preset   = Main Stage内の視点移動
Continuity      = 前後Shotの要素引継ぎ
```

`shots`がない旧入力はv2 Rendererへフォールバックする。`shots`がある入力だけv3 Rendererを使う。

## Shot契約

Visual Beatは0〜4 Shotを持つ。

```json
{
  "shotId": "scene-04-beat-001-shot-002",
  "shotRecipe": "actual-crosses-expected",
  "startChunkId": "scene-04-chunk-001",
  "startProgress": 0.333333,
  "startOffsetMs": 0,
  "endChunkId": "scene-04-chunk-001",
  "endProgress": 0.666667,
  "endOffsetMs": 0,
  "endCue": "予想を上回りました",
  "primaryTargetId": "s4-card-actual",
  "stageLayout": "full-stage",
  "cameraPreset": "push-in",
  "transitionIn": "reframe-shared-element",
  "transitionOut": "hold-outcome",
  "continuityKey": "scene-04-beat-001-flow",
  "typographyTreatment": "gap-highlight",
  "typographyText": "Actual｜AWS 422.3億ドル",
  "soundCue": "soft-impact",
  "foxExpression": "軽い驚き"
}
```

`startProgress`と`endProgress`は実測された音声チャンク内の0〜1位置である。固定秒数で音声へ合わせない。TTS速度が変わっても、Shotは対応チャンク内に残る。

## Shot Recipe

初期Registry：

1. `hero-metric-impact`
2. `contradiction-interrupt`
3. `expected-anchor`
4. `actual-crosses-expected`
5. `gap-macro`
6. `causal-build`
7. `counterforce-interrupt`
8. `entity-cutaway`
9. `split-opposition`
10. `focus-matrix-reveal`
11. `verification-two-paths`
12. `recap-assembly`

一つのShotには一つの`primaryTargetId`だけを指定する。

## Camera Preset

- `static`
- `push-in`
- `pull-back`
- `pan-left`
- `pan-right`
- `follow-path`
- `reframe-outcome`
- `macro-detail`

Cameraは意味がある場合だけ使用する。ランダムズーム、常時浮遊、画面シェイクは禁止する。

## Continuity

同じ`continuityKey`を持つ隣接ShotだけがShared Elementとして接続できる。

- `carry-forward`
- `pin-to-corner`
- `collapse-to-node`
- `merge-to-outcome`
- `reframe-shared-element`

数値や企業の意味を別の対象へMorphしてはならない。ExpectedをActualへ、企業Aを企業Bへ変形しない。

## Kinetic Typography

字幕とは別物である。

- 字幕：音声全文
- 大テロップ：SceneまたはBeatの短い主張
- Kinetic Typography：Main Stage内の一度だけの強調

1 Shot最大1 treatment、22文字以内。同じ文章を字幕と重複させない。

## Sound Cue

固定の手続き生成WAVだけを使用する。

- `soft-whoosh`
- `soft-impact`
- `line-draw`
- `comparison-split`
- `resolve-chime`

外部API・外部URL・有料音源を使用しない。1 Visual Beat最大2回。字幕切替ごとに鳴らさない。音がなくても意味が成立する必要がある。

## Validator

即時エラー：

- 未登録Recipe / Layout / Camera / Transition / SFX / Typography
- ShotがVisual Beat外
- Shotの重複または逆順
- primaryTargetId不明
- Beatで選択されていない対象
- Shared ElementのcontinuityKey不一致
- Scene 9以外の眠そう
- 一Sceneで表情変更3回以上
- 一BeatでSFX 3回以上
- 一Beatで同一Stage Layoutが4 Shot以上連続
- 一Beatで同一Cameraが5 Shot以上連続

通常回：

- 24〜50 Shot
- 6種類以上のShot family
- 3回以上のContinuity handoff

## 7月31日受入入力

7月31日回は39 Shotへ移行する。

- ナレーション変更なし
- 字幕変更なし
- 数字変更なし
- 市場因果変更なし
- Scene順変更なし
- TTS identity変更なし
- Main Stageだけを再構成

正式validator、既存Render Spec契約、字幕テスト、公開画面境界、Remotion bundleを通過した後にだけpreviewへ進める。previewはユーザーが目視確認し、明示依頼なしにfinalへ進まない。
