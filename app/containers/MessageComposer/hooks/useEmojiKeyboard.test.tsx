import { renderHook, act } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import * as KeyboardController from 'react-native-keyboard-controller';

import { EmojiKeyboardProvider, useEmojiKeyboard } from './useEmojiKeyboard';

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

describe('useEmojiKeyboard', () => {
	let mockSharedValue: ReturnType<typeof createValue<boolean>>;
	let mockSearchbarSharedValue: ReturnType<typeof createValue<boolean>>;
	let mockKeyboardHeightSharedValue: ReturnType<typeof createValue<number>>;

	beforeEach(() => {
		mockSharedValue = createValue(false);
		mockSearchbarSharedValue = createValue(false);
		mockKeyboardHeightSharedValue = createValue(20);

		(useSharedValue as jest.Mock)
			.mockReturnValueOnce(mockSharedValue) // showEmojiPickerSharedValue
			.mockReturnValueOnce(mockSearchbarSharedValue) // showEmojiSearchbarSharedValue
			.mockReturnValueOnce(createValue(0)) // height from useKeyboardAnimation
			.mockReturnValueOnce(mockKeyboardHeightSharedValue) // keyboardHeight
			.mockReturnValueOnce(mockKeyboardHeightSharedValue); // previousHeight
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('EmojiKeyboardProvider', () => {
		test('should provide context with shared values', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

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
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiSearchbar).toBe(false);
			expect(result.current.showEmojiPickerSharedValue).toBe(mockSharedValue);
			expect(result.current.showEmojiSearchbarSharedValue).toBe(mockSearchbarSharedValue);
			expect(result.current.keyboardHeight).toBe(mockKeyboardHeightSharedValue);
		});

		test('should open emoji keyboard', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

			act(() => {
				result.current.openEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(true);
		});

		test('should close emoji keyboard', () => {
			mockSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

			act(() => {
				result.current.closeEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
		});

		test('should open emoji searchbar', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

			act(() => {
				result.current.openEmojiSearchbar();
			});

			expect(mockSearchbarSharedValue.value).toBe(true);
		});

		describe('back from emoji search', () => {
			afterEach(() => {
				jest.mocked(Keyboard.dismiss).mockRestore();
			});

			test('keeps the emoji picker open and dismisses the system keyboard', () => {
				const dismiss = jest.spyOn(Keyboard, 'dismiss');
				mockSharedValue.value = true;
				mockSearchbarSharedValue.value = true;
				const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

				act(() => {
					result.current.backToEmojiPicker();
				});

				expect(mockSearchbarSharedValue.value).toBe(false);
				expect(mockSharedValue.value).toBe(true);
				expect(dismiss).toHaveBeenCalledTimes(1);
			});
		});

		test('should reset keyboard (close emoji keyboard and searchbar)', () => {
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

			act(() => {
				result.current.resetKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
			expect(mockSearchbarSharedValue.value).toBe(false);
		});

		test('should handle multiple open/close operations', () => {
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });

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
			renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });
			const keyboardStartsShowing = (height: number) =>
				keyboardHandlers.forEach(handler => handler.onStart?.({ height, duration: 250, progress: 1, target: 1 }));
			return { keyboardStartsShowing };
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

		test.each([
			['a hardware keyboard toolbar', 50],
			['the iOS 27 iPad shortcut bar', 82]
		])('keeps the emoji picker when %s shows', (_, height) => {
			const { keyboardStartsShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardStartsShowing(height);

			expect(mockSharedValue.value).toBe(true);
		});

		const keyboardFinishesShowing = (height: number) => {
			const [eventName, listener] = jest.mocked(KeyboardController.KeyboardEvents.addListener).mock.lastCall!;
			expect(eventName).toBe('keyboardDidShow');
			(listener as (e: { height: number }) => void)({ height });
		};

		test('dismisses it again when the emoji picker was opened while it was still showing', () => {
			renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).toHaveBeenCalledWith({ keepFocus: true });
		});

		test('leaves the keyboard up when it finished showing for the emoji search bar', () => {
			renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;
			mockSearchbarSharedValue.value = true;

			keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});

		test('leaves the keyboard up when it finished showing with the emoji picker closed', () => {
			renderAndCaptureKeyboardHandlers();

			keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});

		test('leaves the picker alone when only an accessory bar finished showing', () => {
			renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardFinishesShowing(82);

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});
	});

	describe('emoji picker height', () => {
		const defaultUseSharedValue = jest.mocked(useSharedValue).getMockImplementation();

		afterEach(() => {
			jest.mocked(useAnimatedReaction).mockReset();
			jest.mocked(useSharedValue).mockImplementation(defaultUseSharedValue);
		});

		const renderPicker = ({ pickerHeight = 250, systemKeyboard = 0, searching = false } = {}) => {
			const showEmojiPicker = createValue(true);
			const showEmojiSearchbar = createValue(searching);
			const systemKeyboardHeight = createValue(systemKeyboard);
			const keyboardHeight = createValue(pickerHeight);
			const previousHeight = createValue(pickerHeight);
			jest
				.mocked(useSharedValue)
				.mockReset()
				.mockReturnValueOnce(showEmojiPicker)
				.mockReturnValueOnce(showEmojiSearchbar)
				.mockReturnValueOnce(systemKeyboardHeight)
				.mockReturnValueOnce(keyboardHeight)
				.mockReturnValueOnce(previousHeight);
			const reactions = new Map<unknown, Parameters<typeof useAnimatedReaction>[1]>();
			jest.mocked(useAnimatedReaction).mockImplementation((_prepare, react, dependencies) => {
				reactions.set(dependencies?.[0], react);
			});
			renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });
			const heightReaction = reactions.get(systemKeyboardHeight)!;
			const searchbarReaction = reactions.get(showEmojiSearchbar)!;
			const openSearch = () => {
				showEmojiSearchbar.set(true);
				searchbarReaction(true, false);
			};
			const closeSearch = () => {
				showEmojiSearchbar.set(false);
				searchbarReaction(false, true);
			};
			const keyboardChanges = (to: number) => {
				const from = systemKeyboardHeight.get();
				systemKeyboardHeight.set(to);
				heightReaction(to, from);
			};
			return { keyboardHeight, openSearch, closeSearch, keyboardChanges };
		};

		test('restores the fixed picker height when the keyboard hides', () => {
			const { keyboardHeight, keyboardChanges } = renderPicker({ pickerHeight: 20, systemKeyboard: 336 });

			keyboardChanges(0);

			expect(keyboardHeight.value).toBe(250);
		});

		test('keeps the keyboard height the picker opened with when the keyboard hides', () => {
			const { keyboardHeight, keyboardChanges } = renderPicker({ pickerHeight: 336, systemKeyboard: 336 });

			keyboardChanges(0);

			expect(keyboardHeight.value).toBe(336);
		});

		test('leaves the emoji search height alone when the keyboard hides', () => {
			const { keyboardHeight, keyboardChanges } = renderPicker({ pickerHeight: 20, systemKeyboard: 336, searching: true });

			keyboardChanges(0);

			expect(keyboardHeight.value).toBe(20);
		});

		test('stays open when a hardware keyboard toolbar shows', () => {
			const { keyboardHeight, keyboardChanges } = renderPicker();

			keyboardChanges(48);

			expect(keyboardHeight.value).toBe(250);
		});

		test('resizes the composer to the keyboard the search input brings up', () => {
			const { keyboardHeight, openSearch, keyboardChanges } = renderPicker();

			openSearch();
			keyboardChanges(336);

			expect(keyboardHeight.value).toBe(336);
		});

		test('comes back at the fixed height after going back from emoji search', () => {
			const { keyboardHeight, openSearch, closeSearch, keyboardChanges } = renderPicker();

			openSearch();
			keyboardChanges(336);
			closeSearch();
			keyboardChanges(0);

			expect(keyboardHeight.value).toBe(250);
		});
	});

	describe('Context without provider', () => {
		test('should work when used without EmojiKeyboardProvider', () => {
			const { result } = renderHook(() => useEmojiKeyboard());

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
