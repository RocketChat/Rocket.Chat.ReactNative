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

jest.mock('expo-av', () => {
	const InterruptionModeAndroid = {
		DoNotMix: 1,
		DuckOthers: 2
	};
	const InterruptionModeIOS = {
		DoNotMix: 1,
		DuckOthers: 2,
		MixWithOthers: 3
	};

	return {
		Audio: {
			getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
			requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
			setAudioModeAsync: jest.fn(() => Promise.resolve()),
			Recording: jest.fn(() => ({
				prepareToRecordAsync: jest.fn(() => Promise.resolve()),
				startAsync: jest.fn(() => Promise.resolve()),
				stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
				setOnRecordingStatusUpdate: jest.fn(),
				getStatusAsync: jest.fn(() => Promise.resolve())
			})),
			Sound: {
				createAsync: jest.fn(() =>
					Promise.resolve({
						sound: {
							setOnPlaybackStatusUpdate: jest.fn(),
							playAsync: jest.fn(() => Promise.resolve()),
							pauseAsync: jest.fn(() => Promise.resolve()),
							stopAsync: jest.fn(() => Promise.resolve()),
							unloadAsync: jest.fn(() => Promise.resolve()),
							getStatusAsync: jest.fn(() => Promise.resolve()),
							setPositionAsync: jest.fn(() => Promise.resolve())
						},
						status: {}
					})
				),
				create: jest.fn(() => ({
					setOnPlaybackStatusUpdate: jest.fn(),
					playAsync: jest.fn(() => Promise.resolve()),
					pauseAsync: jest.fn(() => Promise.resolve()),
					stopAsync: jest.fn(() => Promise.resolve()),
					unloadAsync: jest.fn(() => Promise.resolve()),
					getStatusAsync: jest.fn(() => Promise.resolve()),
					setPositionAsync: jest.fn(() => Promise.resolve()),
					loadAsync: jest.fn(() => Promise.resolve())
				}))
			},
			RecordingStatus: {
				StatusDict: {}
			},
			AudioStatus: {
				StatusDict: {}
			},
			AndroidOutputFormat: {
				AAC_ADTS: 0
			},
			AndroidAudioEncoder: {
				AAC: 0
			},
			IOSAudioQuality: {
				LOW: 0,
				MEDIUM: 1,
				HIGH: 2
			},
			IOSOutputFormat: {
				MPEG4AAC: 0
			},
			RecordingOptionsPresets: {
				LOW_QUALITY: {
					android: {
						extension: '.aac',
						outputFormat: 0,
						audioEncoder: 0,
						sampleRate: 16000,
						numberOfChannels: 1,
						bitRate: 64000
					},
					ios: {
						extension: '.aac',
						audioQuality: 1,
						outputFormat: 0,
						sampleRate: 16000,
						numberOfChannels: 1,
						bitRate: 64000
					},
					web: {}
				},
				HIGH_QUALITY: {
					android: {
						extension: '.aac',
						outputFormat: 0,
						audioEncoder: 0,
						sampleRate: 48000,
						numberOfChannels: 2,
						bitRate: 128000
					},
					ios: {
						extension: '.aac',
						audioQuality: 1,
						outputFormat: 0,
						sampleRate: 48000,
						numberOfChannels: 2,
						bitRate: 128000
					},
					web: {}
				}
			}
		},
		InterruptionModeAndroid,
		InterruptionModeIOS
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
