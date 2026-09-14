# NATIVE-1573 — Expo 57 Android autolinking wiring

Research only. Repo at RN 0.81.5 / expo 54.0.30 (`expo-modules-autolinking` 3.0.23).

Written to `.scratch/research/` because `/docs/` is gitignored (`.gitignore:95: /docs/`).

## 1. What was removed

`expo/scripts/autolinking.gradle` does not exist in `expo@57.0.22`. Verified from the npm tarball:
`expo@57.0.22/scripts/` contains only `autolinking.rb`, `compose-source-maps.js`, `node-binary.sh`,
`react-native-xcode.sh`, `resolveAppEntry.js`, `xcode`. Its delegate target
`expo-modules-autolinking/scripts/android/autolinking_implementation.gradle` is gone too —
`expo-modules-autolinking@57.0.13/scripts/` has only `ios`.

Both still exist in our installed `expo@54.0.30` / `expo-modules-autolinking@3.0.23`.

Removal is documented as "[Android] Remove legacy autolinking integration"
(https://github.com/expo/expo/pull/43303), under `## 55.0.0 — 2026-02-25` → 💡 Others in
https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/CHANGELOG.md
So the break lands at SDK 55, not 57; 57 is simply past it.

Replacement is a real Gradle plugin, shipped inside the autolinking package at
`expo-modules-autolinking@57.0.13/android/expo-gradle-plugin` (subprojects:
`expo-autolinking-settings-plugin`, `expo-autolinking-plugin`, `expo-autolinking-plugin-shared`,
`expo-max-sdk-override-plugin`). The settings plugin id is `expo-autolinking-settings`.
`expoAutolinking.useExpoVersionCatalog` and `expoAutolinking.reactNativeGradlePlugin` were added in
https://github.com/expo/expo/pull/35789 (`expo-modules-autolinking` CHANGELOG).

## 2. Upstream template wiring (primary source)

`expo-template-bare-minimum@57.0.24` (npm tarball) === sdk-57 branch
(https://raw.githubusercontent.com/expo/expo/sdk-57/templates/expo-template-bare-minimum/android/settings.gradle).

### android/settings.gradle (verbatim)

```groovy
pluginManagement {
  def reactNativeGradlePlugin = new File(
    providers.exec {
      workingDir(rootDir)
      commandLine("node", "--print", "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })")
    }.standardOutput.asText.get().trim()
  ).getParentFile().absolutePath
  includeBuild(reactNativeGradlePlugin)

  def expoPluginsPath = new File(
    providers.exec {
      workingDir(rootDir)
      commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
    }.standardOutput.asText.get().trim(),
    "../android/expo-gradle-plugin"
  ).absolutePath
  includeBuild(expoPluginsPath)
}

plugins {
  id("com.facebook.react.settings")
  id("expo-autolinking-settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
  if (System.getenv('EXPO_USE_COMMUNITY_AUTOLINKING') == '1') {
    ex.autolinkLibrariesFromCommand()
  } else {
    ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
  }
}
expoAutolinking.useExpoModules()

rootProject.name = 'HelloWorld'

expoAutolinking.useExpoVersionCatalog()

include ':app'
includeBuild(expoAutolinking.reactNativeGradlePlugin)
```

### android/app/build.gradle — the autolinking-relevant parts

Unchanged from RN's own template at the bottom of the `react { }` block:

```groovy
    /* Autolinking */
    autolinkLibrariesWithApp()
```

The app module applies no expo plugin by hand. `ExpoAutolinkingSettingsPlugin.apply()` adds
`expo.modules:expo-autolinking-plugin` and `expo.modules:expo-max-sdk-override-plugin` to the root
project buildscript classpath in a `beforeRootProject` hook, and applies
`expo-max-sdk-override-plugin` to `:app` once `com.android.application` is present. Source:
`expo-modules-autolinking@57.0.13/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt`.

The template's `react { }` block does carry Expo-specific entries that are not autolinking and are a
separate decision (`entryFile` via `expo/scripts/resolveAppEntry`, `cliFile` = `@expo/cli`,
`bundleCommand = "export:embed"`, `hermesCommand` via `hermes-compiler`).

The template's `dependencies { }` uses `expoLibs.versions.fresco.get()` — that catalog only exists
because of `expoAutolinking.useExpoVersionCatalog()`. If we skip that call we must not reference
`expoLibs`.

## 3. What we have today

`android/settings.gradle` (whole file):

```groovy
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
plugins { id("com.facebook.react.settings") }
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }
rootProject.name = 'RocketChatRN'
include ':watermelondb-jsi'
project(':watermelondb-jsi').projectDir = new File(rootProject.projectDir, '../node_modules/@nozbe/watermelondb/native/android-jsi')
include ':app'

includeBuild('../node_modules/@react-native/gradle-plugin')

apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle");
useExpoModules()
```

`android/app/build.gradle` autolinking surface: `apply plugin: "com.facebook.react"` plus
`autolinkLibrariesWithApp()` inside `react { }`. No expo reference at all. That half already matches
57 and needs no change for autolinking.

## 4. The diff

Only `settings.gradle` changes. Five edits:

1. **Delete** the two trailing lines: the `apply from: ... expo/scripts/autolinking.gradle` and the
   bare `useExpoModules()`. The file they point at no longer ships.
2. **Add** `includeBuild(expoPluginsPath)` inside `pluginManagement`, resolving
   `expo-modules-autolinking/package.json` from `expo/package.json` then `../android/expo-gradle-plugin`.
3. **Add** `id("expo-autolinking-settings")` to the `plugins { }` block.
4. **Change** `ex.autolinkLibrariesFromCommand()` to `ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)`,
   with the `EXPO_USE_COMMUNITY_AUTOLINKING == '1'` escape hatch kept as upstream writes it.
5. **Add** `expoAutolinking.useExpoModules()` (namespaced now, not the bare function) after that block.

Two upstream lines are optional for us and should be decided, not copied blindly:

- `expoAutolinking.useExpoVersionCatalog()` — creates the `expoLibs` catalog from
  `react-native/gradle/libs.versions.toml`, overridden by the `android.*Version` /
  `android.kotlinVersion` gradle properties. We define `compileSdkVersion` etc. in
  `android/build.gradle` `ext` and never reference `expoLibs`, so it is inert unless we adopt it.
  Note `android/gradle.properties` is CI-regenerated, so adding `android.*Version` properties would
  touch both generators.
- `includeBuild(expoAutolinking.reactNativeGradlePlugin)` — the resolved-path form of our existing
  hardcoded `includeBuild('../node_modules/@react-native/gradle-plugin')`. Upstream has it both in
  `pluginManagement` and at the end; we currently duplicate the hardcoded path the same way.

Our `include ':watermelondb-jsi'` line is unaffected; it is a manual project include, not autolinking.

## 5. Which autolinker links which library

Two independent mechanisms survive in 57:

- **Expo modules autolinking** — `expoAutolinking.useExpoModules()`. Links only packages that ship an
  `expo-module.config.json`.
- **RN community autolinking** — `autolinkLibrariesFromCommand(...)` in settings + `autolinkLibrariesWithApp()`
  in `app/build.gradle`. Links packages the React Native CLI config describes. In 57 the *resolver* is
  swapped: `expoAutolinking.rnConfigCommand` is `expo-modules-autolinking react-native-config --json`
  (see `ExpoAutolinkingSettingsExtension.kt`), a drop-in for `npx @react-native-community/cli config`.
  The mechanism, `react-native.config.js` semantics and the generated `PackageList` are unchanged; only
  who computes the JSON changes. `EXPO_USE_COMMUNITY_AUTOLINKING=1` reverts to the CLI resolver.

Checked in our `node_modules`: none of the four has an `expo-module.config.json`.

| package | expo-module.config.json | react-native.config.js | linked by |
| --- | --- | --- | --- |
| react-native-webrtc 124.0.7 | no | yes (macos switch only) | RN community autolinking |
| react-native-callkeep 4.3.16 | no | no (package.json defaults) | RN community autolinking |
| react-native-mmkv ^4.1.2 | no | yes (empty android/ios params) | RN community autolinking |
| react-native-nitro-modules ^0.33.9 | no | yes (empty android/ios params) | RN community autolinking |

So all four keep linking after the migration, through the RN path, with Expo's resolver producing the
config. None of the four uses an exotic `react-native.config.js` key (no `cmakeListsPath`,
`libraryName`, `componentDescriptors`, `sourceDir` overrides), so the resolver-swap risk for them is
low. Our root `react-native.config.js` is `{ dependencies: {} }` — no manual links to port.

Residual risk worth a build check rather than more reading: `expo-modules-autolinking` 57 added
"Support linking published Gradle plugins" (https://github.com/expo/expo/pull/48334) and fixed
"autolinking pure C++ React Native modules published without `includesGeneratedCode: true`"
(https://github.com/expo/expo/pull/48514) — nitro/mmkv are exactly that shape, so verify the
generated `PackageList` and the Nitro CMake build on the first Expo-57 Android build.

## Sources

- https://registry.npmjs.org/expo-template-bare-minimum/-/expo-template-bare-minimum-57.0.24.tgz (`package/android/settings.gradle`, `package/android/app/build.gradle`)
- https://raw.githubusercontent.com/expo/expo/sdk-57/templates/expo-template-bare-minimum/android/settings.gradle (identical to the tarball)
- https://registry.npmjs.org/expo/-/expo-57.0.22.tgz (`package/scripts/` listing)
- https://registry.npmjs.org/expo-modules-autolinking/-/expo-modules-autolinking-57.0.13.tgz (`android/expo-gradle-plugin/**`, `CHANGELOG.md`, `scripts/` listing)
- https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/CHANGELOG.md (SDK 55 "Remove legacy autolinking integration")
- https://github.com/expo/expo/pull/43303 , https://github.com/expo/expo/pull/35789 , https://github.com/expo/expo/pull/48334 , https://github.com/expo/expo/pull/48514
