'use strict';

const { patchAppliesTo } = require('../platform-patches');

const patchTouching = (...paths) =>
	paths.map(path => `diff --git a/${path} b/${path}\nindex 1111111..2222222 100644\n--- a/${path}\n+++ b/${path}\n`).join('');

describe('patchAppliesTo', () => {
	it.each([
		['android source', 'node_modules/react-native-callkeep/android/src/main/java/io/wazo/callkeep/VoiceConnection.java'],
		['gradle build file', 'node_modules/react-native-webview/build.gradle']
	])('leaves a patch touching only %s out of iOS', (_, patchedPath) => {
		expect(patchAppliesTo(patchTouching(patchedPath), 'android')).toBe(true);
		expect(patchAppliesTo(patchTouching(patchedPath), 'ios')).toBe(false);
	});

	it.each([
		['ios source', 'node_modules/@react-native-cookies/cookies/ios/RNCookieManagerIOS/RNCookieManagerIOS.m'],
		['expo apple source', 'node_modules/expo-audio/apple/AudioModule.swift'],
		['podspec', 'node_modules/react-native-math-view/RNMathView.podspec']
	])('leaves a patch touching only %s out of Android', (_, patchedPath) => {
		expect(patchAppliesTo(patchTouching(patchedPath), 'ios')).toBe(true);
		expect(patchAppliesTo(patchTouching(patchedPath), 'android')).toBe(false);
	});

	it.each([
		['JS', 'node_modules/js-base64/base64.js'],
		['a codegen spec', 'node_modules/@react-native-camera-roll/camera-roll/src/NativeCameraRollModule.ts'],
		['shared C++', 'node_modules/react-native-gesture-handler/common/cpp/Handler.cpp'],
		['a package manifest', 'node_modules/react-native-modal/package.json']
	])('applies a patch touching %s to both platforms', (_, patchedPath) => {
		expect(patchAppliesTo(patchTouching(patchedPath), 'android')).toBe(true);
		expect(patchAppliesTo(patchTouching(patchedPath), 'ios')).toBe(true);
	});

	it('applies a patch touching both platforms to both', () => {
		const patch = patchTouching(
			'node_modules/react-native-gesture-handler/android/src/main/java/Handler.kt',
			'node_modules/react-native-gesture-handler/apple/Handler.mm'
		);
		expect(patchAppliesTo(patch, 'android')).toBe(true);
		expect(patchAppliesTo(patch, 'ios')).toBe(true);
	});

	it('reads the paths of a patch without a git header', () => {
		const patch = '--- a/node_modules/expo-font/android/src/FontLoader.kt\n+++ b/node_modules/expo-font/android/src/FontLoader.kt\n';
		expect(patchAppliesTo(patch, 'android')).toBe(true);
		expect(patchAppliesTo(patch, 'ios')).toBe(false);
	});

	it('applies a patch with no recognizable paths to both platforms', () => {
		expect(patchAppliesTo('not a diff', 'android')).toBe(true);
		expect(patchAppliesTo('not a diff', 'ios')).toBe(true);
	});
});
