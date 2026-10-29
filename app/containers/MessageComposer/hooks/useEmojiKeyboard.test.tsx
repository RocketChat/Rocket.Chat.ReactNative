import { renderHook, act } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import * as KeyboardController from 'react-native-keyboard-controller';

import { EmojiKeyboardProvider, useEmojiKeyboard } from './useEmojiKeyboard';

jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));

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
			value: 20,
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
			.mockReturnValueOnce({ value: 0, get: () => 0, set: jest.fn() }) // height from useKeyboardAnimation
			.mockReturnValueOnce(mockKeyboardHeightSharedValue) // keyboardHeight
			.mockReturnValueOnce(mockKeyboardHeightSharedValue); // previousHeight
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('EmojiKeyboardProvider', () => {
		test('should provide context with shared values', () => {
			const wrapper = EmojiKeyboardProvider;
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
			const wrapper = EmojiKeyboardProvider;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			expect(result.current.showEmojiKeyboard).toBe(false);
			expect(result.current.showEmojiSearchbar).toBe(false);
			expect(result.current.showEmojiPickerSharedValue).toBe(mockSharedValue);
			expect(result.current.showEmojiSearchbarSharedValue).toBe(mockSearchbarSharedValue);
			expect(result.current.keyboardHeight).toBe(mockKeyboardHeightSharedValue);
		});

		test('should open emoji keyboard', () => {
			const wrapper = EmojiKeyboardProvider;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.openEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(true);
		});

		test('should close emoji keyboard', () => {
			const wrapper = EmojiKeyboardProvider;
			mockSharedValue.value = true;
			const { result } = renderHook(() => useEmojiKeyboard(), { wrapper });

			act(() => {
				result.current.closeEmojiKeyboard();
			});

			expect(mockSharedValue.value).toBe(false);
		});

		test('should open emoji searchbar', () => {
			const wrapper = EmojiKeyboardProvider;
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
			const wrapper = EmojiKeyboardProvider;
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
			const wrapper = EmojiKeyboardProvider;
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
			renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });
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

		test('keeps the emoji picker when the iOS 27 iPad shortcut bar shows', () => {
			const { keyboardStartsShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			keyboardStartsShowing(82);

			expect(mockSharedValue.value).toBe(true);
		});

		test('dismisses it again when the emoji picker was opened while it was still showing', async () => {
			jest.mocked(KeyboardController.KeyboardController.isVisible).mockReturnValueOnce(true);
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			await keyboardFinishesShowing(336);

			expect(KeyboardController.KeyboardController.dismiss).toHaveBeenCalledWith({ keepFocus: true });
		});

		const keyboardDidShowListener = () => {
			const [eventName, listener] = jest.mocked(KeyboardController.KeyboardEvents.addListener).mock.lastCall!;
			expect(eventName).toBe('keyboardDidShow');
			return listener as () => void;
		};

		test('waits for iOS to report the keyboard shown before dismissing it again', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			await keyboardFinishesShowing(336);
			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
			keyboardDidShowListener()();

			expect(KeyboardController.KeyboardController.dismiss).toHaveBeenCalledWith({ keepFocus: true });
		});

		test('leaves the keyboard up when emoji search opened before iOS reported it shown', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			await keyboardFinishesShowing(336);
			mockSearchbarSharedValue.value = true;
			keyboardDidShowListener()();

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
		});

		test('leaves the keyboard up when the emoji picker closed before iOS reported it shown', async () => {
			const { keyboardFinishesShowing } = renderAndCaptureKeyboardHandlers();
			mockSharedValue.value = true;

			await keyboardFinishesShowing(336);
			mockSharedValue.value = false;
			keyboardDidShowListener()();

			expect(KeyboardController.KeyboardController.dismiss).not.toHaveBeenCalled();
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
			renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });
			const [heightReaction] = reactions;
			return { keyboardHidden: () => heightReaction(0, 336) };
		};

		test('restores the fixed picker height when the keyboard hides', () => {
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
			const showEmojiPicker = createValue(true);
			const showEmojiSearchbar = createValue(false);
			const systemKeyboardHeight = createValue(0);
			const keyboardHeight = createValue(250);
			const previousHeight = createValue(250);
			jest
				.mocked(useSharedValue)
				.mockReset()
				.mockReturnValueOnce(showEmojiPicker)
				.mockReturnValueOnce(showEmojiSearchbar)
				.mockReturnValueOnce(systemKeyboardHeight)
				.mockReturnValueOnce(keyboardHeight)
				.mockReturnValueOnce(previousHeight);
			const reactions: Parameters<typeof useAnimatedReaction>[1][] = [];
			jest.mocked(useAnimatedReaction).mockImplementation((_prepare, react) => {
				reactions.push(react);
			});
			renderHook(() => useEmojiKeyboard(), { wrapper: EmojiKeyboardProvider });
			const [heightReaction, , searchbarReaction] = reactions;
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

		test('stays open when a hardware keyboard toolbar shows', () => {
			const { keyboardHeight, keyboardChanges } = renderFixedHeightPicker();

			keyboardChanges(48);

			expect(keyboardHeight.value).toBe(250);
		});

		test('resizes the composer to the keyboard the search input brings up', () => {
			const { keyboardHeight, openSearch, keyboardChanges } = renderFixedHeightPicker();

			openSearch();
			keyboardChanges(336);

			expect(keyboardHeight.value).toBe(336);
		});

		test('comes back at the fixed height after going back from emoji search', () => {
			const { keyboardHeight, openSearch, closeSearch, keyboardChanges } = renderFixedHeightPicker();

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
