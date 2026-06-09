# Visual Regression Testing

This repo now has an isolated `react-native-owl` harness behind `USE_OWL=true`.

## Local iOS flow

1. Build the fixture app:
   `pnpm owl:build:ios`
2. Generate or refresh baselines:
   `pnpm owl:test:update:ios`
3. Compare against committed baselines:
   `pnpm owl:test:ios`

Optional Jest filters can be forwarded to Owl:

- `pnpm owl:test:ios -- --testPathPattern='tests/owl/smoke.owl.tsx'`
- `pnpm owl:test:ios -- --testNamePattern='expanded fixture state'`

## Layout

- `app/owls/` contains the isolated render harness and reusable fixtures.
- `tests/owl/` contains Owl test files.
- `.owl/baseline/ios/` is expected to be committed once baselines are approved.

## GitHub Actions

Use `.github/workflows/visual-regression-ios.yml`.

- `workflow_dispatch` supports `update_baseline=true` to generate fresh baselines and upload them as an artifact.
- Pull requests touching Owl files will run compare mode and require committed iOS baseline images.

## Current constraint

Formidable's published Owl docs still state support only up to React Native `0.70.x`. This repo is on React Native `0.81.5`, so treat the integration as experimental until the first end-to-end run is validated in CI and on a local simulator.
