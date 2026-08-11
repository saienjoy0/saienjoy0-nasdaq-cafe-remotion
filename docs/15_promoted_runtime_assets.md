# Promoted Runtime Assets

The canonical Scheduled Preview path may render daily binary assets that were already verified inside the immutable Plot handoff bundle.

Promotion is transport only:

- trust only handoff manifest rows with `role=asset`;
- re-check each asset's declared SHA-256 and size;
- stage the binary under `public/generated/preflight-assets/YYYY-MM-DD/<assetId>/...`;
- write `runtime-assets/YYYY-MM-DD/runtime_asset_registry.json` using the existing runtime asset registry contract;
- never infer new asset IDs or rewrite `render_spec.json`;
- when no promoted registry exists for `EPISODE_ID`, keep the existing static-only asset context.

Final render authorization is unaffected. Promotion remains Preview-only when the handoff manifest has `mode=preview` and `final_authorized=false`.
