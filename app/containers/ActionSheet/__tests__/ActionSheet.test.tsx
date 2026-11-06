import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
	ActionSheetProvider,
	hideActionSheetRef,
	showActionSheetRef,
	type TActionSheetOptions,
	useActionSheet
} from '../Provider';
import { HANDLE_HEIGHT } from '../useActionSheetDetents';

const mockPresent = jest.fn((): Promise<void> => Promise.resolve());
const mockDismiss = jest.fn(() => Promise.resolve());
const mockResize = jest.fn(() => Promise.resolve());

jest.mock('@lodev09/react-native-true-sheet', () => {
	const { forwardRef, useImperativeHandle } = require('react');
	const { View: MockView } = require('react-native');
	const MockTrueSheet = forwardRef((props: object, ref: unknown) => {
		useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss, resize: mockResize }));
		return <MockView {...props} />;
	});
	MockTrueSheet.displayName = 'TrueSheet';
	return { __esModule: true, TrueSheet: MockTrueSheet, TrueSheetProvider: ({ children }: { children: unknown }) => children };
});

const finishPresent = () => act(() => screen.UNSAFE_getByType(TrueSheet).props.onDidPresent());
const finishDismiss = () => act(() => screen.UNSAFE_getByType(TrueSheet).props.onDidDismiss());

describe('ActionSheet', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockPresent.mockClear();
		mockDismiss.mockClear();
		render(
			<ActionSheetProvider>
				<View />
			</ActionSheetProvider>
		);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('shows a sheet requested while the previous one is dismissing after the dismissal finishes', () => {
		const onFirstClose = jest.fn();
		const onSecondClose = jest.fn();
		act(() => showActionSheetRef({ children: <Text>first sheet</Text>, onClose: onFirstClose }));
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>second sheet</Text>, onClose: onSecondClose }));

		expect(screen.getByText('first sheet')).toBeOnTheScreen();
		expect(screen.queryByText('second sheet')).toBeNull();

		finishDismiss();
		act(() => jest.runAllTimers());

		expect(onFirstClose).toHaveBeenCalledTimes(1);
		expect(onSecondClose).not.toHaveBeenCalled();
		expect(screen.getByText('second sheet')).toBeOnTheScreen();
	});

	it('shows a sheet right away once the previous one has been dismissed', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		finishPresent();
		act(() => hideActionSheetRef());
		finishDismiss();
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));

		expect(screen.getByText('second sheet')).toBeOnTheScreen();
	});

	it('keeps a newer request when an older queued presentation has not fired', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>queued sheet</Text> }));
		finishDismiss();
		act(() => showActionSheetRef({ children: <Text>newest sheet</Text> }));
		act(() => jest.runAllTimers());

		expect(screen.getByText('newest sheet')).toBeOnTheScreen();
		expect(screen.queryByText('queued sheet')).toBeNull();
		expect(mockPresent).toHaveBeenCalledTimes(2);
	});

	it('lets an onClose request supersede a queued sheet', () => {
		act(() =>
			showActionSheetRef({
				children: <Text>first sheet</Text>,
				onClose: () => showActionSheetRef({ children: <Text>newest sheet</Text> })
			})
		);
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>queued sheet</Text> }));
		finishDismiss();
		act(() => jest.runAllTimers());

		expect(screen.getByText('newest sheet')).toBeOnTheScreen();
		expect(mockPresent).toHaveBeenCalledTimes(2);
	});

	it('cancels a queued presentation hidden after dismissal', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>queued sheet</Text> }));
		finishDismiss();
		act(() => hideActionSheetRef());
		act(() => jest.runAllTimers());

		expect(mockPresent).toHaveBeenCalledTimes(1);
	});

	it('dismisses a sheet hidden before it finished presenting once the presentation ends', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));

		expect(mockDismiss).not.toHaveBeenCalled();

		finishPresent();

		expect(mockDismiss).toHaveBeenCalledTimes(1);

		finishDismiss();
		act(() => jest.runAllTimers());

		expect(screen.getByText('second sheet')).toBeOnTheScreen();
	});

	it('drops a queued sheet when hide is called again during the dismissal', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));
		act(() => hideActionSheetRef());
		finishDismiss();
		act(() => jest.runAllTimers());

		expect(mockDismiss).toHaveBeenCalledTimes(1);
		expect(mockPresent).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('second sheet')).toBeNull();
	});

	it('cancels the scheduled presentation of a queued sheet on unmount', () => {
		act(() => showActionSheetRef({ children: <Text>first sheet</Text> }));
		finishPresent();
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));
		finishDismiss();
		screen.unmount();

		expect(jest.getTimerCount()).toBe(0);
	});

	it('recovers when the sheet fails to present', async () => {
		const onClose = jest.fn();
		mockPresent.mockRejectedValueOnce(new Error('present failed'));
		act(() => showActionSheetRef({ children: <Text>first sheet</Text>, onClose }));
		await act(async () => {});
		act(() => hideActionSheetRef());
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));

		expect(screen.getByText('second sheet')).toBeOnTheScreen();
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});

type TKeyboardHandler = () => void;

const Opener = ({ options, testID = 'open' }: { options: TActionSheetOptions; testID?: string }) => {
	const { showActionSheet } = useActionSheet();
	return (
		<Pressable testID={testID} onPress={() => showActionSheet(options)}>
			<Text>open</Text>
		</Pressable>
	);
};

const open = (options: TActionSheetOptions) => {
	const utils = render(
		<ActionSheetProvider>
			<Opener options={options} />
		</ActionSheetProvider>
	);
	fireEvent.press(utils.getByTestId('open'));
	return utils;
};

describe('ActionSheet opened with useActionSheet', () => {
	const handlers: Record<string, TKeyboardHandler> = {};
	const removeListener = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		Object.keys(handlers).forEach(event => delete handlers[event]);
		jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: TKeyboardHandler) => {
			handlers[event] = handler;
			return { remove: removeListener };
		}) as unknown as typeof Keyboard.addListener);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('a sheet that asks to expand while the keyboard is up', () => {
		const options = { children: <Text>content</Text>, snaps: ['90%', '100%'], expandOnKeyboard: true };

		it('moves to its largest snap when the keyboard opens', () => {
			open(options);

			handlers.keyboardWillShow();

			expect(mockResize).toHaveBeenCalledWith(1);
		});

		it('goes back to its first snap when the keyboard closes', () => {
			open(options);
			handlers.keyboardWillShow();
			mockResize.mockClear();

			handlers.keyboardWillHide();

			expect(mockResize).toHaveBeenCalledWith(0);
		});

		it('stops listening to the keyboard when it goes away', () => {
			const { unmount } = open(options);

			unmount();

			expect(removeListener).toHaveBeenCalledTimes(2);
		});
	});

	it('keeps the sheet of a nested provider apart from the sheet of the one around it', () => {
		const { getByTestId, getByText } = render(
			<ActionSheetProvider>
				<Opener testID='open-outer' options={{ children: <Text>outer sheet</Text> }} />
				<ActionSheetProvider nested>
					<Opener testID='open-nested' options={{ children: <Text>nested sheet</Text> }} />
				</ActionSheetProvider>
			</ActionSheetProvider>
		);

		fireEvent.press(getByTestId('open-outer'));
		fireEvent.press(getByTestId('open-nested'));

		expect(getByText('outer sheet')).toBeTruthy();
		expect(getByText('nested sheet')).toBeTruthy();
	});

	it('leaves the size alone when the keyboard opens, unless the sheet asked for more room', () => {
		open({ children: <Text>content</Text>, snaps: ['90%', '100%'] });

		expect(Object.keys(handlers)).toEqual([]);
	});

	it('has nowhere bigger to go with a single snap', () => {
		open({ children: <Text>content</Text>, snaps: ['90%'], expandOnKeyboard: true });

		expect(Object.keys(handlers)).toEqual([]);
	});

	describe('a full-container sheet', () => {
		const options = { children: <Text>content</Text>, snaps: ['90%'], fullContainer: true };
		const windowHeight = 800;
		const contentHeight = (utils: ReturnType<typeof open>) =>
			StyleSheet.flatten(utils.getByTestId('action-sheet').props.style).height;

		beforeEach(() => {
			jest.mocked(useWindowDimensions).mockReturnValue({ width: 400, height: windowHeight, scale: 1, fontScale: 1 });
		});

		it('is sized from the window until the sheet reports where it sits', () => {
			const utils = open(options);

			expect(contentHeight(utils)).toBe(windowHeight * 0.9 - HANDLE_HEIGHT);
		});

		const report = (utils: ReturnType<typeof open>, handler: string, index: number, position: number) => {
			act(() => {
				utils.UNSAFE_getByType(TrueSheet).props[handler]({ nativeEvent: { index, position, detent: 0.9 } });
			});
		};

		it('is sized from the top edge the sheet reports', () => {
			const utils = open(options);

			report(utils, 'onWillPresent', 0, 200);

			expect(contentHeight(utils)).toBe(windowHeight - 200 - HANDLE_HEIGHT);
		});

		it('follows the sheet when it settles at another snap', () => {
			const utils = open(options);
			report(utils, 'onWillPresent', 0, 200);

			report(utils, 'onPositionChange', 1, 60);

			expect(contentHeight(utils)).toBe(windowHeight - 60 - HANDLE_HEIGHT);
		});

		it('ignores the positions the sheet passes through while it moves', () => {
			const utils = open(options);
			report(utils, 'onWillPresent', 0, 200);

			report(utils, 'onPositionChange', 0.4, 140);

			expect(contentHeight(utils)).toBe(windowHeight - 200 - HANDLE_HEIGHT);
		});
	});
});
