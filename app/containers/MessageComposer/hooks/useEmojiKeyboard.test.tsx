import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import { EmojiKeyboardProvider, useEmojiKeyboard } from './useEmojiKeyboard';
import { MessageInnerContext } from '../context';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
	useSharedValue: jest.fn(),
	useAnimatedReaction: jest.fn(),
	runOnJS: jest.fn(fn => fn),
	withTiming: jest.fn(value => value)
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
	KeyboardController: {
		setFocusTo: jest.fn(async () => {})
	},
	useKeyboardHandler: jest.fn()
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: jest.fn(() => ({ bottom: 20 }))
}));

describe('useEmojiKeyboard', () => {
	let mockSharedValue: any;
	let mockSearchbarSharedValue: any;
	let mockKeyboardHeightSharedValue: any;
	let mockFocus: jest.Mock;

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
			value: 20,
			get: jest.fn(() => mockKeyboardHeightSharedValue.value),
			set: jest.fn((v: number) => {
				mockKeyboardHeightSharedValue.value = v;
			}),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			modify: jest.fn()
		};

		mockFocus = jest.fn();

		(useSharedValue as jest.Mock)
			.mockReturnValueOnce(mockSharedValue) // showEmojiPickerSharedValue
			.mockReturnValueOnce(mockSearchbarSharedValue) // showEmojiSearchbarSharedValue
			.mockReturnValueOnce({ value: 0 }) // height from useKeyboardAnimation
			.mockReturnValueOnce(mockKeyboardHeightSharedValue) // keyboardHeight
			.mockReturnValueOnce(mockKeyboardHeightSharedValue); // previousHeight
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const createWrapper = (focus = mockFocus) => {
		const messageInnerContextValue = {
			sendMessage: jest.fn(),
			onEmojiSelected: jest.fn(),
			closeEmojiKeyboardAndAction: jest.fn(),
			focus
		};

		return ({ children }: { children: React.ReactElement }) => (
			<EmojiKeyboardProvider>
				<MessageInnerContext.Provider value={messageInnerContextValue}>{children}</MessageInnerContext.Provider>
			</EmojiKeyboardProvider>
		);
	};

	describe('EmojiKeyboardProvider', () => {
		test('should provide context with shared values', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			expect(result.current.showEmojiPickerSharedValue).toBeDefined();
			expect(result.current.showEmojiSearchbarSharedValue).toBeDefined();
			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiSearchbar).toBe(false);
			expect(result.current.keyboardHeight).toBeDefined();
			expect(typeof result.current.openEmojiKeyboard).toBe('function');
			expect(typeof result.current.closeEmojiKeyboard).toBe('function');
			expect(typeof result.current.openEmojiSearchbar).toBe('function');
			expect(typeof result.current.closeEmojiSearchbar).toBe('function');
			expect(typeof result.current.resetKeyboard).toBe('function');
		});
	});

	describe('useEmojiKeyboard hook', () => {
		test('should initialize with correct default values', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiSearchbar).toBe(false);
			expect(result.current.showEmojiPickerSharedValue).toBe(mockSharedValue);
			expect(result.current.showEmojiSearchbarSharedValue).toBe(mockSearchbarSharedValue);
			expect(result.current.keyboardHeight).toBe(mockKeyboardHeightSharedValue);
		});

		test('should open emoji keyboard', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.openEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(true);
		});

		test('should close emoji keyboard', () => {
			const wrapper = createWrapper();
			mockSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
		});

		test('should open emoji searchbar', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.openEmojiSearchbar();
			});

			expect(mockSearchbarSharedValue.value).toBe(true);
		});

		test('should close emoji searchbar and call focus', () => {
			const mockFocusForTest = jest.fn();
			const wrapper = createWrapper(mockFocusForTest);
			mockSearchbarSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiSearchbar();
			});

			expect(mockSearchbarSharedValue.value).toBe(false);
			expect(mockFocusForTest).toHaveBeenCalledTimes(1);
		});

		test('should close emoji searchbar without calling focus when focus is not available', () => {
			const mockFocusForTest = jest.fn();
			const wrapper = createWrapper(undefined);
			mockSearchbarSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiSearchbar();
			});

			expect(mockSearchbarSharedValue.value).toBe(false);
			expect(mockFocusForTest).not.toHaveBeenCalled();
		});

		test('should reset keyboard (close emoji keyboard and searchbar)', () => {
			const wrapper = createWrapper();
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.resetKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
			expect(mockSearchbarSharedValue.value).toBe(false);
		});

		test('should handle multiple open/close operations', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			// Open emoji keyboard
			act(() => {
				result.current.openEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(true);

			// Close emoji keyboard
			act(() => {
				result.current.closeEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(false);

			// Open emoji searchbar
			act(() => {
				result.current.openEmojiSearchbar();
			});
			expect(mockSearchbarSharedValue.value).toBe(true);

			// Close emoji searchbar
			act(() => {
				result.current.closeEmojiSearchbar();
			});
			expect(mockSearchbarSharedValue.value).toBe(false);

			// Open emoji keyboard again
			act(() => {
				result.current.openEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(true);
		});
	});

	describe('Context without provider', () => {
		test('should work when used without EmojiKeyboardProvider', () => {
			const messageInnerContextValue = {
				sendMessage: jest.fn(),
				onEmojiSelected: jest.fn(),
				closeEmojiKeyboardAndAction: jest.fn(),
				focus: mockFocus
			};

			const wrapper = ({ children }: { children: React.ReactElement }) => (
				<MessageInnerContext.Provider value={messageInnerContextValue}>{children}</MessageInnerContext.Provider>
			);

			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			// Should still provide all expected functions and values
			expect(result.current.showEmojiPickerSharedValue).toBeDefined();
			expect(result.current.showEmojiSearchbarSharedValue).toBeDefined();
			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiSearchbar).toBe(false);
			expect(result.current.keyboardHeight).toBeDefined();
			expect(typeof result.current.resetKeyboard).toBe('function');
		});
	});
});
