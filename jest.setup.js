import React from 'react';
import mockClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock.js';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { Image } from 'expo-image';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-safe-area-context', () => {
	const inset = { top: 0, right: 0, bottom: 0, left: 0 };
	return {
		...jest.requireActual('react-native-safe-area-context'),
		SafeAreaProvider: jest.fn(({ children }) => children),
		SafeAreaConsumer: jest.fn(({ children }) => children(inset)),
		useSafeAreaInsets: jest.fn(() => inset),
		useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 }))
	};
});

const loadAsyncMock = jest.spyOn(Image, 'loadAsync');
loadAsyncMock.mockImplementation(() => Promise.resolve({ width: 200, height: 300 }));

// @ts-ignore
global.__reanimatedWorkletInit = () => {};
jest.mock('react-native-reanimated', () => {
	const actual = jest.requireActual('react-native-reanimated/mock');
	return {
		...actual,
		useSharedValue: jest.fn(init => ({ value: init })),
		useAnimatedReaction: jest.fn(),
		runOnJS: jest.fn(fn => fn),
		withTiming: jest.fn(value => value),
		useAnimatedGestureHandler: jest.fn(() => jest.fn()),
		useAnimatedStyle: jest.fn(fn => fn),
		useDerivedValue: jest.fn(fn => fn)
	};
});

jest.mock('@react-native-clipboard/clipboard', () => mockClipboard);

jest.mock('react-native-file-viewer', () => ({
	open: jest.fn(() => null)
}));

jest.mock('expo-haptics', () => jest.fn(() => null));

jest.mock('expo-font', () => ({
	isLoaded: jest.fn(() => true),
	loadAsync: jest.fn(() => Promise.resolve()),
	__esModule: true
}));

jest.mock('expo-audio', () => {
	const InterruptionModeAndroid = {
		DoNotMix: 1,
		DuckOthers: 2
	};
	const InterruptionModeIOS = {
		DoNotMix: 1,
		DuckOthers: 2,
		MixWithOthers: 3
	};

	const mockAudioPlayer = {
		play: jest.fn(),
		pause: jest.fn(),
		stop: jest.fn(),
		replay: jest.fn(),
		setPlaying: jest.fn(),
		setLooping: jest.fn(),
		setMuted: jest.fn(),
		setVolume: jest.fn(),
		setPlaybackRate: jest.fn(),
		seekTo: jest.fn(),
		release: jest.fn(),
		addListener: jest.fn(() => jest.fn()),
		removeListener: jest.fn(),
		getStatusAsync: jest.fn(() => Promise.resolve()),
		playing: false,
		looping: false,
		muted: false,
		volume: 1.0,
		playbackRate: 1.0,
		currentTime: 0,
		duration: 0,
		loaded: false,
		progress: 0,
	 buffering: false,
		keepAlive: false
	};

	return {
		createAudioPlayer: jest.fn(() => mockAudioPlayer),
		AudioPlayer: jest.fn(() => mockAudioPlayer),
		Audio: {
			setAudioModeAsync: jest.fn(() => Promise.resolve()),
			getAudioModeAsync: jest.fn(() => Promise.resolve({})),
			requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
			getRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true }))
		},
		setAudioModeAsync: jest.fn(() => Promise.resolve()),
		getAudioModeAsync: jest.fn(() => Promise.resolve({})),
		requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
		getRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
		useAudioPlayer: jest.fn(() => mockAudioPlayer),
		useAudioRecorder: jest.fn(() => ({
			isRecording: false,
			permission: { granted: true },
			requestPermissions: jest.fn(() => Promise.resolve({ granted: true })),
			start: jest.fn(),
			stop: jest.fn(),
			record: jest.fn(() => Promise.resolve()),
			prepareToRecordAsync: jest.fn(() => Promise.resolve()),
			getStatus: jest.fn(() => ({ canRecord: true, isRecording: false, duration: 0, metering: 0 }))
		})),
		useAudioRecorderState: jest.fn(() => ({
			isRecording: false,
			permission: { granted: true },
			canRecord: true,
			duration: 0,
			metering: 0,
			uri: ''
		})),
		RecordingPresets: {
			HIGH_QUALITY: {
				android: {
					bitRate: 128000,
					channels: 2,
					codec: 'aac',
					outputFormat: 'mpeg_ts',
					sampleRate: 48000
				},
				ios: {
					averageBitRate: 128000,
					channels: 2,
					codec: 'aac',
					extension: 'caf',
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false,
					outputFormat: 'aac',
					sampleRate: 48000
				},
				web: {}
			},
			LOW_QUALITY: {
				android: {
					bitRate: 64000,
					channels: 1,
					codec: 'aac',
					outputFormat: 'mpeg_ts',
					sampleRate: 16000
				},
				ios: {
					averageBitRate: 64000,
					channels: 1,
					codec: 'aac',
					extension: 'caf',
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false,
					outputFormat: 'aac',
					sampleRate: 16000
				},
				web: {}
			}
		},
		InterruptionModeAndroid,
		InterruptionModeIOS
	};
});

jest.mock('expo-video', () => {
	const mockVideoPlayer = {
		play: jest.fn(),
		pause: jest.fn(),
		stop: jest.fn(),
		replay: jest.fn(),
		setPlaying: jest.fn(),
		setLooping: jest.fn(),
		setMuted: jest.fn(),
		setVolume: jest.fn(),
		setPlaybackRate: jest.fn(),
		seekTo: jest.fn(),
		replace: jest.fn(),
		release: jest.fn(),
		addListener: jest.fn(() => jest.fn()),
		removeListener: jest.fn(),
		playing: false,
		looping: false,
		muted: false,
		volume: 1.0,
		playbackRate: 1.0,
		currentTime: 0,
		duration: 0,
		loaded: false,
		progress: 0,
		buffering: false
	};

	return {
		useVideoPlayer: jest.fn(() => mockVideoPlayer),
		VideoView: jest.fn(() => null),
		VideoPlayer: jest.fn(() => mockVideoPlayer)
	};
});

jest.mock('./app/lib/methods/search', () => ({
	search: () => []
}));

jest.mock('./app/lib/database', () => ({
	active: {
		get: jest.fn()
	}
}));

jest.mock('./app/lib/hooks/useFrequentlyUsedEmoji', () => ({
	useFrequentlyUsedEmoji: () => ({
		frequentlyUsed: [],
		loaded: true
	})
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		fontScale: 1
	}))
}));

jest.mock('./app/lib/hooks/useResponsiveLayout/useResponsiveLayout', () => {
	const actual = jest.requireActual('./app/lib/hooks/useResponsiveLayout/useResponsiveLayout');
	return {
		...actual,
		useResponsiveLayout: jest.fn(() => ({
			fontScale: 1,
			width: 390,
			height: 844,
			isLargeFontScale: false,
			fontScaleLimited: 1,
			rowHeight: actual.BASE_ROW_HEIGHT,
			rowHeightCondensed: actual.BASE_ROW_HEIGHT_CONDENSED
		})),
		FONT_SCALE_LIMIT: actual.FONT_SCALE_LIMIT
	};
});

jest.mock('./app/containers/CustomIcon', () => {
	const actualNav = jest.requireActual('./app/containers/CustomIcon');

	return {
		...actualNav,
		IconSet: {
			hasIcon: () => true
		}
	};
});

jest.mock('./app/lib/encryption', () => ({
	encryptMessage: jest.fn(() => ({ rid: 'test', msg: 'test' }))
}));

jest.mock('@react-navigation/native', () => {
	const actualNav = jest.requireActual('@react-navigation/native');
	const { useEffect } = require('react');
	return {
		...actualNav,
		useFocusEffect: useEffect,
		isFocused: () => true,
		useIsFocused: () => true,
		useRoute: () => jest.fn(),
		useNavigation: () => ({
			navigate: jest.fn(),
			addListener: () => jest.fn()
		}),
		createNavigationContainerRef: jest.fn(),
		navigate: jest.fn(),
		addListener: jest.fn(() => jest.fn())
	};
});

jest.mock('expo-notifications', () => ({
	getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
	getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
	requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
	setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
	dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
	setNotificationHandler: jest.fn(),
	setNotificationCategoryAsync: jest.fn(() => Promise.resolve()),
	addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
	addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
	addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
	getLastNotificationResponse: jest.fn(() => null),
	DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT'
}));

jest.mock('expo-device', () => ({
	isDevice: true
}));

jest.mock('@lodev09/react-native-true-sheet', () => {
	const React = require('react');
	const { View } = require('react-native');
	const TrueSheet = React.forwardRef((props, ref) => {
		React.useImperativeHandle(ref, () => ({
			present: () => Promise.resolve(),
			dismiss: () => Promise.resolve(),
			resize: () => Promise.resolve()
		}));
		return <View {...props} />;
	});
	TrueSheet.displayName = 'TrueSheet';
	return {
		__esModule: true,
		TrueSheet,
		TrueSheetProvider: ({ children }) => children
	};
});

jest.mock('react-native-math-view', () => {
	const react = require('react-native');
	return {
		__esModule: true,
		default: react.View, // Default export
		MathText: react.View // {...} Named export
	};
});

jest.mock('react-native-keyboard-controller');

jest.mock('react-native-webview', () => {
	const React = require('react');
	const { View } = require('react-native');
	const WebView = React.forwardRef(() => <View />);
	WebView.defaultProps = {};
	return { WebView };
});

/**
 * Custom serializer to address an issue where `ref` causes React internals
 * to appear in snapshots or triggers "RangeError: Invalid string length", or
 * "Maximum call stack size exceeded"
 *
 * If this issue is resolved in the future, these serializers can likely be removed,
 * and snapshots updated accordingly.
 *
 * See: https://github.com/jestjs/jest/issues/15402
 */

/**
 * This serializer is **shallow**:
 * - It only cleans the top-level object passed to it.
 * - Removes React internal properties that can cause huge or circular snapshots
 * - Removes `ref` from `props` to avoid dumping the full React internal instance.
 *
 * Note: Nested refs inside `props.children` or deeper objects are not affected.
 */
expect.addSnapshotSerializer({
	test: val => val && !!val.ref,
	print: (value, serialize) => {
		return serialize({
			...value,
			_debugOwner: undefined,
			child: undefined,
			return: undefined,
			ref: undefined,
			props: { ...value.props, ref: undefined }
		});
	}
});

const _isReactRefObject = val => {
	return val && typeof val === 'object' && val.constructor === Object && Object.keys(val).length === 1 && 'current' in val;
};

/**
 * Serializes a React ref object for snapshots.
 * Instead of including the full component instance (which can be huge and circular),
 * it replaces it with a simple JSON object containing the component's name.
 */
const _printRefObject = val => {
	const { current } = val;
	const name = current?.constructor?.name || current?.displayName || current?.name || 'Object';
	return JSON.stringify({ current: name });
};

expect.addSnapshotSerializer({ test: _isReactRefObject, print: _printRefObject });
