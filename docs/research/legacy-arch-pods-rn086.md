# NATIVE-1574 — Legacy-arch removal vs third-party pods at RN 0.86

Repo state at time of research: RN 0.81.5, Expo ^54.0.0, `newArchEnabled=true` (`android/gradle.properties:38`), iOS `use_frameworks! :linkage => :static` (`ios/Podfile:22`).

## Correction to the framing

RN 0.86 is not where legacy-arch code is deleted. The removal happened earlier and is narrower than "the interop layer goes away":

- 0.80 froze the legacy architecture with deprecation warnings — https://reactnative.dev/blog/2025/06/12/react-native-0.80
- 0.82 is the first release running entirely on the New Architecture — https://reactnative.dev/blog/2025/10/08/react-native-0.82
- 0.84 made `RCT_REMOVE_LEGACY_ARCH` the default on iOS: "Legacy Architecture code is no longer included in your iOS builds... No breakages are expected for apps already on the New Architecture — **the Interop Layer code required for compatibility remains in place**." Android lost a list of `bridge.*` / `uimanager.*` classes. — https://reactnative.dev/blog/2026/02/11/react-native-0.84
- 0.86 is titled "no breaking changes"; its only legacy-arch item is the deprecation of `ViewUtil.getUIManagerType`. — https://reactnative.dev/blog/2026/06/11/react-native-0.86

So `RCTBridgeModule` / `RCTEventEmitter` / `RCTViewManager` remain available through the interop layer at 0.86. No primary source was found announcing their removal or the removal of `RCT_NEW_ARCH_ENABLED`.

Expo SDK → RN mapping (https://expo.dev/changelog/sdk-57, https://docs.expo.dev/versions/latest/): 54→0.81, 55→0.83, 56→0.85, **57→0.86** ("SDK 57 upgrades React Native from 0.85 to 0.86").

Load-bearing consequence: this app already runs new arch on 0.81, so every legacy module below is **already** running through interop in production. 0.86 does not change that contract. The upgrade risk is build-system level (precompiled React-Core + `use_frameworks!`), not "the module stops existing".

## Per library

### react-native-webrtc — 124.0.7 → 124.0.8

- Latest npm 124.0.8 (2026-07-21); peerDeps `react-native: ">=0.60.0"` on every 124.x, no upper bound. https://registry.npmjs.org/react-native-webrtc
- New-arch status: **interop only**. No `codegenConfig` in package.json; podspec declares `s.dependency 'React-Core'` with no `install_modules_dependencies`. Local sources confirm legacy APIs: `ios/RCTWebRTC/WebRTCModule.h` imports `React/RCTBridgeModule.h` + `React/RCTEventEmitter.h`, `ios/RCTWebRTC/RTCVideoViewManager.h` imports `React/RCTViewManager.h`. https://github.com/react-native-webrtc/react-native-webrtc/blob/master/react-native-webrtc.podspec
- A real Fabric/TurboModule port exists only as an unmerged WIP: https://github.com/react-native-webrtc/react-native-webrtc/pull/1590 (maintainer tested RN 0.76–0.84 both archs; iOS side unverified). Tracking discussion https://github.com/react-native-webrtc/react-native-webrtc/issues/1557.
- Open new-arch rendering complaints (RTCView black screen, video not rendering), RN 0.74–0.80 era: #1611, #1716, #1736, #1742, #1659.
- No issue or PR in the repo mentions 0.86. No mention of `-Wnon-modular-include-in-framework-module`, `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES`, `RCT_USE_PREBUILT_RNCORE`, or `ReactNativeDependencies`.
- Verdict: pod should still compile and link at 0.86 — it consumes only interop-layer headers, which 0.84 explicitly kept. The `View` side (`RTCVideoViewManager`) is the part with a history of silent runtime breakage under new arch, so it needs a device smoke test (video render + PiP), not a compile check.

### react-native-callkeep — 4.3.16, npm is dead

- npm latest is still 4.3.16 (2024-11-18), peerDeps `react-native: ">=0.40.0"`. https://registry.npmjs.org/react-native-callkeep
- GitHub `master` has merges as recent as 2026-09-14 with no tag/publish since 2024. Any fix must be consumed via a git ref or fork, not a version bump.
- Podspec depends on the umbrella `pod 'React'`, source files `ios/RNCallKeep/*.{h,m}`, no codegen. `ios/RNCallKeep/RNCallKeep.h` is `@interface RNCallKeep : RCTEventEmitter`. https://github.com/react-native-webrtc/react-native-callkeep/blob/master/RNCallKeep.podspec
- Known new-arch defects, all open: duplicate `@ReactMethod` overloads crash the Android TurboModule interop parser (`TurboModuleInteropUtils$ParsingException`) — #798, #822, #857; fix PR #816 merged to master, never published. **The repo's local `patches/react-native-callkeep+4.3.16.patch` already deletes the duplicate `displayIncomingCall`/`startCall` overloads**, so this app is not exposed. iOS `didLoadWithEvents` not firing under new arch is reported in #822 with only a community patch.
- No issue mentions 0.86, bridgeless, or non-modular includes. No maintained new-arch fork found.
- Verdict: compiles and links at 0.86 on the same interop reasoning. The real exposure is maintenance, not 0.86: upstream ships nothing, so every fix is a local patch. `pod 'React'` resolving is the one thing to verify at install time.

### react-native-nitro-modules — 0.33.9 → **must bump, ≥0.37.0**

- Latest 0.37.1 (2026-08-27). peerDeps wildcarded (`react`, `react-native` = `*`) in both 0.33.9 and 0.37.1, so pnpm will **not** warn — the risk is silent. https://registry.npmjs.org/react-native-nitro-modules
- Documented floor is RN 0.75+ (uses `jsi::NativeState`); no published compatibility matrix. https://nitro.margelo.com/docs/getting-started/minimum-requirements
- RN 0.86/0.87 work: https://github.com/mrousavy/nitro/pull/1424 and /1425 (0.87 and 0.86 `RawProps::at` overloads) were closed, superseded by https://github.com/mrousavy/nitro/pull/1507 "Preserve classic View prop parsing across React Native versions", released in **v0.37.0** (2026-08-20). v0.36.2 notes explicit RN 0.87+ support via `installJSIBindingsWithRuntime` overloading.
- New-arch native by construction; podspec uses `install_modules_dependencies(s)` and depends on `React-jsi` / `React-callinvoker`. Legacy branch only for `react_native_version < 80`.
- Verdict: **0.33.9 is below the floor for 0.86.** Bump to 0.37.x as part of the upgrade. No prebuilt-React-Core or non-modular-include reports.

### react-native-mmkv — 4.1.2 → 4.3.2

- Latest 4.3.2. peerDeps `react`, `react-native`, `react-native-nitro-modules` all `*`. https://registry.npmjs.org/react-native-mmkv
- Nitro-based; `NitroMmkv.podspec` depends on `MMKVCore 2.4.2`, `React-jsi`, `React-callinvoker`, calls `install_modules_dependencies(s)`.
- No issue in the repo mentions 0.86. The local `patches/react-native-mmkv+4.1.2.patch` is JS-only (disables the test mock) and will need re-cutting against 4.3.2.
- Verdict: no independent 0.86 risk; it inherits nitro's. Bump together with nitro-modules.

## The real iOS risk: precompiled React-Core + `use_frameworks!`

This is where the `-Wnon-modular-include-in-framework-module` class of error comes from, and it is **not** a webrtc/callkeep problem — no report exists for either. It is a React-Core packaging problem that this app is exposed to because of `use_frameworks! :linkage => :static` in `ios/Podfile`, the same reason `@react-native-firebase/app` already hits it.

- Prebuilt React-Core (`RCT_USE_PREBUILT_RNCORE=1`, `ReactNativeDependencies.xcframework`) landed in 0.81 and became **default at 0.85**. https://expo.dev/blog/precompiled-react-native-for-ios
- The failure mode: with the 0.85 default plus `use_frameworks!`, `RCTDefines.h` macros (`RCT_EXTERN`, `RCT_EXPORT_METHOD`) get scoped to a sibling submodule and stop propagating to consumers, breaking third-party pods that include React headers non-modularly — named victims were React Native Firebase's Auth/Storage/Messaging/Firestore pods. Fix (reorder the React umbrella header to load `RCTDefines.h` first, drop the submodule wildcard export) is cited as landing in 0.85. https://github.com/reactwg/react-native-releases/issues/1306
- Checksum instability with both flags on: https://github.com/facebook/react-native/issues/55446
- Since 2026-09-09 Maven Central 301-redirects the prebuilt iOS tarballs to `repo.reactnative.dev`, which 404s, so 0.86.x `pod install` silently falls back to building React-Core from source. https://github.com/react/react-native/issues/58427

Both `use_frameworks!` consumers here (webrtc via `React-Core`, callkeep via `React`) sit downstream of exactly this. Scoped mitigations, in order of preference:

1. Opt out of prebuilt React-Core (`RCT_USE_PREBUILT_RNCORE=0`) — a one-line env change at `pod install`, restores the 0.84 build shape, costs build time. Matches the fallback 0.86 is doing involuntarily today anyway.
2. If staying on prebuilt: set `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` per failing pod target in the existing `post_install` loop in `ios/Podfile` — the loop already special-cases `react-native-webview`, so the mechanism is in place. This is sufficient for the warning-as-error class; it is **not** sufficient if the macros genuinely fail to resolve, which is the 0.85 `RCTDefines.h` symptom.

A scoped compiler flag is therefore enough for the include-visibility class of error, and not enough for the macro-scoping class. Decide by which error `pod install` + build actually produces; the 0.85 umbrella-header fix may already have closed the second.

## Summary

| Library | Now | Target | Arch | Compiles at 0.86 | Action |
|---|---|---|---|---|---|
| react-native-webrtc | 124.0.7 | 124.0.8 | interop (RCTBridgeModule + RCTViewManager) | expected yes, interop retained at 0.84 | patch bump; smoke-test video render/PiP on device |
| react-native-callkeep | 4.3.16 | 4.3.16 (npm dead) | interop (RCTEventEmitter) | expected yes | no bump available; keep local patch; verify `pod 'React'` resolves |
| react-native-nitro-modules | 0.33.9 | 0.37.1 | new-arch native | **no at 0.33.9** | mandatory bump ≥0.37.0 (PR #1507) |
| react-native-mmkv | 4.1.2 | 4.3.2 | Nitro | inherits nitro | bump with nitro; re-cut the JS patch |

Open questions not resolvable from sources: no primary source confirms `RCTBridgeModule`/`RCTViewManager` symbol removal or `RCT_NEW_ARCH_ENABLED` removal at 0.86 by name, and no source states the `RCT_USE_PREBUILT_RNCORE` default for 0.86 itself (0.85 default is documented; 0.86 behaviour is inferred from the artifact-404 fallback issue). Both are cheap to settle empirically during the 1570 swap by running `pod install` once.
