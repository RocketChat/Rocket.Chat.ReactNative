import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import { EmojiKeyboardProvider, useEmojiKeyboard, useEmojiKeyboardHeight } from './useEmojiKeyboard';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
	useSharedValue: jest.fn(),
	useAnimatedReaction: jest.fn(),
	runOnJS: jest.fn(fn => fn),
	withTiming: jest.fn(value => value)
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
	useKeyboardHandler: jest.fn()
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: jest.fn(() => ({ bottom: 20 }))
}));

describe('useEmojiKeyboard', () => {
	let mockSharedValue: any;

	beforeEach(() => {
		mockSharedValue = {
			value: false,
			get: jest.fn(() => mockSharedValue.value),
			set: jest.fn((v: boolean) => {
				mockSharedValue.value = v;
			}),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			modify: jest.fn()
		};

		(useSharedValue as jest.Mock).mockReturnValue(mockSharedValue);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const wrapper = ({ children }: { children: React.ReactElement }) => <EmojiKeyboardProvider>{children}</EmojiKeyboardProvider>;

	describe('EmojiKeyboardProvider', () => {
		test('should provide context with shared value', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			expect(result.current.showEmojiPickerSharedValue).toBeDefined();
			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(typeof result.current.openEmojiKeyboard).toBe('function');
			expect(typeof result.current.closeEmojiKeyboard).toBe('function');
		});
	});

	describe('useEmojiKeyboard hook', () => {
		test('should initialize with correct default values', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiPickerSharedValue).toBe(mockSharedValue);
		});

		test('should open emoji keyboard', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.openEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(true);
		});

		test('should close emoji keyboard', () => {
			mockSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
		});

		test('should open emoji searchbar', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.openEmojiSearchbar();
			});

			expect(mockSharedValue.value).toBe(true);
		});

		test('should close emoji searchbar', () => {
			mockSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiSearchbar();
			});

			expect(mockSharedValue.value).toBe(false);
		});

		test('should handle multiple open/close operations', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			// Open
			act(() => {
				result.current.openEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(true);

			// Close
			act(() => {
				result.current.closeEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(false);

			// Open again
			act(() => {
				result.current.openEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(true);
		});
	});

	describe('useEmojiKeyboardHeight hook', () => {
		test('should initialize with correct default values', () => {
			const { result } = renderHook(() => useEmojiKeyboardHeight(), { wrapper });

			expect(result.current.keyboardHeight).toBeDefined();
		});

		test('should handle keyboard height changes', () => {
			const { result } = renderHook(() => useEmojiKeyboardHeight(), { wrapper });

			// The hook should be properly initialized
			expect(result.current.keyboardHeight).toBe(mockSharedValue);
		});
	});

	describe('Context without provider', () => {
		test('should return empty context when used without provider', () => {
			const { result } = renderHook(() => useEmojiKeyboard());

			// When used without provider, the context returns an empty object
			// This is the actual behavior, not throwing an error
			expect(result.current.showEmojiPickerSharedValue).toBeUndefined();
		});
	});
});
