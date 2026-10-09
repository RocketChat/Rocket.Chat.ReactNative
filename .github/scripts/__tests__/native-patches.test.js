'use strict';

const { isNativePatch } = require('../native-patches');

const patchTouching = (...paths) =>
	paths.map(path => `diff --git a/${path} b/${path}\nindex 1111111..2222222 100644\n--- a/${path}\n+++ b/${path}\n`).join('');

describe('isNativePatch', () => {
	it.each([
		['android source', 'node_modules/react-native-callkeep/android/src/main/java/io/wazo/callkeep/VoiceConnection.java'],
		['ios source', 'node_modules/@react-native-cookies/cookies/ios/RNCookieManagerIOS/RNCookieManagerIOS.m'],
		['expo apple source', 'node_modules/expo-audio/apple/AudioModule.swift'],
		['podspec', 'node_modules/react-native-math-view/RNMathView.podspec'],
		['gradle build file', 'node_modules/react-native-webview/build.gradle'],
		['codegen spec', 'node_modules/@react-native-camera-roll/camera-roll/src/NativeCameraRollModule.ts']
	])('treats a patch touching %s as native', (_, patchedPath) => {
		expect(isNativePatch(patchTouching(patchedPath))).toBe(true);
	});

	it.each([
		['compiled JS', 'node_modules/js-base64/base64.js'],
		['type declarations', 'node_modules/@types/ejson/index.d.ts'],
		['package manifest', 'node_modules/react-native-modal/package.json'],
		['TypeScript source', 'node_modules/@react-navigation/core/src/useNavigation.tsx']
	])('treats a patch touching only %s as JS-only', (_, patchedPath) => {
		expect(isNativePatch(patchTouching(patchedPath))).toBe(false);
	});

	it('treats a patch as native when any one of its files is native', () => {
		expect(
			isNativePatch(
				patchTouching('node_modules/expo-font/build/FontHooks.js', 'node_modules/expo-font/ios/FontLoaderModule.swift')
			)
		).toBe(true);
	});
});
