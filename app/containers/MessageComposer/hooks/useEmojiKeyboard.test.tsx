import { type ReactElement } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import * as KeyboardController from 'react-native-keyboard-controller';

import { EmojiKeyboardProvider, useEmojiKeyboard } from './useEmojiKeyboard';
import { MessageInnerContext } from '../context';

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
			.mockReturnValueOnce({ value: 0, get: () => 0, set: jest.fn() }) // height from useKeyboardAnimation
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
			focus,
			getText: jest.fn(() => ''),
			setInput: jest.fn()
		};

		return ({ children }: { children: ReactElement }) => (
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

		describe('back from emoji search', () => {
			afterEach(() => {
				jest.mocked(Keyboard.dismiss).mockRestore();
			});

			test('keeps the emoji picker open without focusing the composer', () => {
				const dismiss = jest.spyOn(Keyboard, 'dismiss');
				mockSharedValue.value = true;
				mockSearchbarSharedValue.value = true;
				const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: createWrapper() });

				act(() => {
					result.current.backToEmojiPicker();
				});

				expect(mockSearchbarSharedValue.value).toBe(false);
				expect(mockSharedValue.value).toBe(true);
				expect(dismiss).toHaveBeenCalledTimes(1);
				expect(mockFocus).not.toHaveBeenCalled();
			});
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

			// Open emoji keyboard again
			act(() => {
				result.current.openEmojiKeyboard();
			});
			expect(mockSharedValue.value).toBe(true);
		});
	});

	describe('system keyboard shown while the emoji picker is open', () => {
		afterEach(() => {
			jest.mocked(KeyboardController.useKeyboardHandler).mockRestore();
		});

		const renderAndCaptureKeyboardHandlers = () => {
			const keyboardHandlers: Parameters<typeof KeyboardController.useKeyboardHandler>[0][] = [];
			jest.spyOn(KeyboardController, 'useKeyboardHandler').mockImplementation(handler => {
				keyboardHandlers.push(handler);
			});
			renderHook(() => useEmojiKeyboard(), { wrapper: createWrapper() });
			const keyboardStartsShowing = (height: number) =>
				keyboardHandlers.forEach(handler => handler.onStart?.({ height, duration: 250, progress: 1, target: 1 }));
			const keyboardFinishesShowing = async (height: number) => {
				keyboardHandlers.forEach(handler => handler.onEnd?.({ height, duration: 250, progress: 1, target: 1 }));
				await Promise.resolve();
			};
			return { keyboardStartsShowing, keyboardFinishesShowing };
		};

		test('closes the emoji picker', () => {
			const { keyboardStartsShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardStartsShowing(336);

			expect(mockSharedValue.value).toBe(false);
		});

		test('keeps the emoji picker while the emoji search bar owns the keyboard', () => {
			const { keyboardStartsShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;

			keyboardStartsShowing(336);

			expect(mockSharedValue.value).toBe(true);
		});

		test('keeps the emoji picker when only a hardware keyboard toolbar shows', () => {
			const { keyboardStartsShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardStartsShowing(50);

			expect(mockSharedValue.value).toBe(true);
		});

		test('dismisses it again when the emoji picker was opened while it was still showing', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			await keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).toHaveBeenCalledWith({ keepFocus: true });
		});

		test('stays up once it finished showing for the emoji search bar', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;

			await keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});

		test('stays up once it finished showing with the emoji picker closed', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();

			await keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});
	});

	describe('system keyboard finished hiding while the emoji picker is open', () => {
		afterEach(() => {
			jest.mocked(useAnimatedReaction).mockReset();
		});

		const renderAndCaptureHeightReaction = () => {
			const reactions: Parameters<typeof useAnimatedReaction>[1][] = [];
			jest.mocked(useAnimatedReaction).mockImplementation((_prepare, react) => {
				reactions.push(react);
			});
			renderHook(() => useEmojiKeyboard(), { wrapper: createWrapper() });
			const [heightReaction] = reactions;
			return { keyboardHidden: () => heightReaction(0, 336) };
		};

		test('restores the fixed picker height after going back from emoji search', () => {
			const { keyboardHidden } = renderAndCaptureHeightReaction();
			mockSharedValue.value = true;

			keyboardHidden();

			expect(mockKeyboardHeightSharedValue.value).toBe(250);
		});

		test('keeps the keyboard height the picker opened with', () => {
			const { keyboardHidden } = renderAndCaptureHeightReaction();
			mockSharedValue.value = true;
			mockKeyboardHeightSharedValue.value = 336;

			keyboardHidden();

			expect(mockKeyboardHeightSharedValue.value).toBe(336);
		});

		test('leaves the emoji search height alone', () => {
			const { keyboardHidden } = renderAndCaptureHeightReaction();
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;

			keyboardHidden();

			expect(mockKeyboardHeightSharedValue.value).toBe(20);
		});
	});

	describe('fixed-height emoji picker', () => {
		const defaultUseSharedValue = jest.mocked(useSharedValue).getMockImplementation();

		afterEach(() => {
			jest.mocked(useAnimatedReaction).mockReset();
			jest.mocked(useSharedValue).mockImplementation(defaultUseSharedValue);
		});

		const createValue = <T,>(initial: T) => {
			const sharedValue = {
				value: initial,
				get: () => sharedValue.value,
				set: (next: T) => {
					sharedValue.value = next;
				},
				addListener: jest.fn(),
				removeListener: jest.fn(),
				modify: jest.fn()
			};
			return sharedValue;
		};

		const renderFixedHeightPicker = () => {
			const systemKeyboardHeight = createValue(0);
			const keyboardHeight = createValue(250);
			jest
				.mocked(useSharedValue)
				.mockReset()
				.mockReturnValueOnce(createValue(true)) // showEmojiPickerSharedValue
				.mockReturnValueOnce(createValue(false)) // showEmojiSearchbarSharedValue
				.mockReturnValueOnce(systemKeyboardHeight)
				.mockReturnValueOnce(keyboardHeight)
				.mockReturnValueOnce(createValue(250)); // previousHeight
			const reactions: Parameters<typeof useAnimatedReaction>[1][] = [];
			jest.mocked(useAnimatedReaction).mockImplementation((_prepare, react) => {
				reactions.push(react);
			});
			renderHook(() => useEmojiKeyboard(), { wrapper: createWrapper() });
			const [heightReaction, , searchbarReaction] = reactions;
			return { systemKeyboardHeight, keyboardHeight, heightReaction, searchbarReaction };
		};

		test('stays open when a hardware keyboard toolbar shows', () => {
			const { systemKeyboardHeight, keyboardHeight, heightReaction } = renderFixedHeightPicker();

			systemKeyboardHeight.set(48);
			heightReaction(48, 0);

			expect(keyboardHeight.value).toBe(250);
		});

		test('resizes the composer to the keyboard the search input brings up', () => {
			const { systemKeyboardHeight, keyboardHeight, heightReaction, searchbarReaction } = renderFixedHeightPicker();

			searchbarReaction(true, false);
			systemKeyboardHeight.set(336);
			heightReaction(336, 0);

			expect(keyboardHeight.value).toBe(336);
		});
	});

	describe('Context without provider', () => {
		test('should work when used without EmojiKeyboardProvider', () => {
			const messageInnerContextValue = {
				sendMessage: jest.fn(),
				onEmojiSelected: jest.fn(),
				closeEmojiKeyboardAndAction: jest.fn(),
				focus: mockFocus,
				getText: jest.fn(() => ''),
				setInput: jest.fn()
			};

			const wrapper = ({ children }: { children: ReactElement }) => (
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
