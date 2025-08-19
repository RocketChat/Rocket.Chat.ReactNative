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
		withTiming: jest.fn(value => value)
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

jest.mock('expo-av', () => ({
	...jest.requireActual('expo-av'),
	Audio: {
		...jest.requireActual('expo-av').Audio,
		getPermissionsAsync: jest.fn(() => ({ status: 'granted', granted: true, canAskAgain: true })),
		Recording: jest.fn(() => ({
			prepareToRecordAsync: jest.fn(),
			startAsync: jest.fn(),
			stopAndUnloadAsync: jest.fn(),
			setOnRecordingStatusUpdate: jest.fn()
		})),
		Sound: {
			createAsync: jest.fn(() => ({
				sound: {
					setOnPlaybackStatusUpdate: jest.fn()
				}
			}))
		}
	}
}));

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

jest.mock('./app/lib/hooks/useResponsiveLayout/useResponsiveLayout', () => ({
	useResponsiveLayout: jest.fn(() => ({
		fontScale: 1,
		isLargeFontScale: false,
		fontScaleLimited: 1,
		rowHeight: 75,
		rowHeightCondensed: 60
	})),
	FONT_SCALE_LIMIT: 1.3
}));

jest.mock('./app/containers/CustomIcon', () => {
	const actualNav = jest.requireActual('./app/containers/CustomIcon');

	return {
		...actualNav,
		IconSet: {
			hasIcon: () => true
		}
	};
});

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

jest.mock('react-native-notifications', () => ({
	Notifications: {
		getInitialNotification: jest.fn(() => Promise.resolve()),
		registerRemoteNotifications: jest.fn(),
		events: () => ({
			registerRemoteNotificationsRegistered: jest.fn(),
			registerRemoteNotificationsRegistrationFailed: jest.fn(),
			registerNotificationReceivedForeground: jest.fn(),
			registerNotificationReceivedBackground: jest.fn(),
			registerNotificationOpened: jest.fn()
		})
	}
}));

jest.mock('@discord/bottom-sheet', () => {
	const react = require('react-native');
	return {
		__esModule: true,
		default: react.View,
		BottomSheetScrollView: react.ScrollView
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
