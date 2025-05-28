import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import { EmojiKeyboardProvider, useEmojiKeyboardHeight } from './useEmojiKeyboard';

// Mock dependencies
jest.mock('react-native-reanimated', () => ({
	useSharedValue: jest.fn(),
	useAnimatedReaction: jest.fn(),
	withTiming: jest.fn(value => value),
	runOnJS: jest.fn(fn => fn)
}));

jest.mock('react-native-keyboard-controller', () => ({
	useKeyboardHandler: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: jest.fn(() => ({ bottom: 34 }))
}));

jest.mock('../context', () => ({
	useMessageComposerApi: jest.fn(() => ({
		openEmojiKeyboard: jest.fn(),
		closeEmojiKeyboard: jest.fn()
	}))
}));

describe('useEmojiKeyboardHeight', () => {
	const mockSharedValue = {
		value: 0,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		modify: jest.fn()
	};

	const mockShowEmojiPickerSharedValue = {
		value: false,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		modify: jest.fn()
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useSharedValue as jest.Mock).mockImplementation(initialValue => {
			if (initialValue === false) {
				return mockShowEmojiPickerSharedValue;
			}
			return { ...mockSharedValue, value: initialValue };
		});
	});

	const wrapper = ({ children }: { children: React.ReactElement | null }) => (
		<EmojiKeyboardProvider>{children}</EmojiKeyboardProvider>
	);

	it('should add notch (bottom safe area) when keyboard is closed', () => {
		const mockKeyboardHeight = { ...mockSharedValue, value: 300 };
		(useSharedValue as jest.Mock).mockImplementation(initialValue => {
			if (initialValue === false) {
				return mockShowEmojiPickerSharedValue;
			}
			if (initialValue === 34) {
				// bottom safe area
				return mockKeyboardHeight;
			}
			return { ...mockSharedValue, value: initialValue };
		});

		renderHook(() => useEmojiKeyboardHeight(), { wrapper });

		// Simulate closing emoji keyboard
		const mockUseAnimatedReaction = require('react-native-reanimated').useAnimatedReaction;
		const reactionCallback = mockUseAnimatedReaction.mock.calls[0][1];

		// Call the reaction callback with currentValue = false (closing emoji keyboard)
		// and previousValue = true (was open)
		act(() => {
			reactionCallback(false, true);
		});

		// Verify that withTiming was called with height 0 + notch (34)
		const mockWithTiming = require('react-native-reanimated').withTiming;
		expect(mockWithTiming).toHaveBeenCalledWith(34, { duration: 250 });
	});

	it('should not add notch when keyboard is open', () => {
		const mockKeyboardHeight = { ...mockSharedValue, value: 34 };
		(useSharedValue as jest.Mock).mockImplementation(initialValue => {
			if (initialValue === false) {
				return mockShowEmojiPickerSharedValue;
			}
			if (initialValue === 34) {
				// bottom safe area
				return mockKeyboardHeight;
			}
			return { ...mockSharedValue, value: initialValue };
		});

		renderHook(() => useEmojiKeyboardHeight(), { wrapper });

		// Simulate keyboard opening with height 300
		const mockUseKeyboardHandler = require('react-native-keyboard-controller').useKeyboardHandler;
		const keyboardHandler = mockUseKeyboardHandler.mock.calls[0][0];

		act(() => {
			keyboardHandler.onStart({ height: 300 });
		});

		// Verify that withTiming was called with height 300 + 0 (no notch when keyboard is open)
		const mockWithTiming = require('react-native-reanimated').withTiming;
		expect(mockWithTiming).toHaveBeenCalledWith(300, { duration: 250 });
	});

	it('should always call updateKeyboardHeight when closing emoji keyboard regardless of current height', () => {
		const mockKeyboardHeight = { ...mockSharedValue, value: 0 }; // Already at 0
		(useSharedValue as jest.Mock).mockImplementation(initialValue => {
			if (initialValue === false) {
				return mockShowEmojiPickerSharedValue;
			}
			if (initialValue === 34) {
				// bottom safe area
				return mockKeyboardHeight;
			}
			return { ...mockSharedValue, value: initialValue };
		});

		renderHook(() => useEmojiKeyboardHeight(), { wrapper });

		// Simulate closing emoji keyboard when height is already 0
		const mockUseAnimatedReaction = require('react-native-reanimated').useAnimatedReaction;
		const reactionCallback = mockUseAnimatedReaction.mock.calls[0][1];

		act(() => {
			reactionCallback(false, true);
		});

		// Verify that withTiming was still called (this tests the fix)
		const mockWithTiming = require('react-native-reanimated').withTiming;
		expect(mockWithTiming).toHaveBeenCalledWith(34, { duration: 250 });
	});
});
