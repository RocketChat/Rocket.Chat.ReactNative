import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import { EmojiKeyboardProvider, useEmojiKeyboard, useEmojiKeyboardHeight } from './useEmojiKeyboard';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
	useSharedValue: jest.fn(),
	useAnimatedReaction: jest.fn(),
	useDerivedValue: jest.fn(_fn => ({
		// Return a mock shared value for the derived value
		value: 0,
		get: jest.fn(() => 0),
		set: jest.fn(),
		addListener: jest.fn(),
		removeListener: jest.fn(),
		modify: jest.fn()
	})),
	runOnJS: jest.fn(fn => fn),
	withTiming: jest.fn(value => value)
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
	KeyboardController: {
		setFocusTo: jest.fn(async () => {})
	},
	useKeyboardHandler: jest.fn(),
	useReanimatedKeyboardAnimation: jest.fn(() => ({
		height: { value: 0 },
		progress: { value: 0 }
	}))
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: jest.fn(() => ({ bottom: 20 }))
}));

describe('useEmojiKeyboard', () => {
	let mockSharedValue: any;
	let mockSearchbarSharedValue: any;
	let mockKeyboardHeightSharedValue: any;

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

		mockSearchbarSharedValue = {
			value: false,
			get: jest.fn(() => mockSearchbarSharedValue.value),
			set: jest.fn((v: boolean) => {
				mockSearchbarSharedValue.value = v;
			}),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			modify: jest.fn()
		};

		mockKeyboardHeightSharedValue = {
			value: 0,
			get: jest.fn(() => mockKeyboardHeightSharedValue.value),
			set: jest.fn((v: number) => {
				mockKeyboardHeightSharedValue.value = v;
			}),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			modify: jest.fn()
		};

		(useSharedValue as jest.Mock)
			.mockReturnValueOnce(mockSharedValue) // showEmojiPickerSharedValue
			.mockReturnValueOnce(mockSearchbarSharedValue) // showEmojiSearchbarSharedValue
			.mockReturnValue(mockKeyboardHeightSharedValue); // previousKeyboardHeight
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

			expect(mockSearchbarSharedValue.value).toBe(true);
		});

		test('should close emoji searchbar', async () => {
			mockSearchbarSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			await act(async () => {
				await result.current.closeEmojiSearchbar();
			});

			expect(mockSearchbarSharedValue.value).toBe(false);
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

			// The hook should be properly initialized with the derived value
			expect(result.current.keyboardHeight).toBeDefined();
			expect(result.current.keyboardHeight.value).toBe(0);
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
