import { act, fireEvent, render } from '@testing-library/react-native';
import { type Ref } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { ActionSheetProvider, type TActionSheetOptions, useActionSheet } from '.';
import { HANDLE_HEIGHT } from './useActionSheetDetents';

const mockResize = jest.fn(() => Promise.resolve());

jest.mock('@lodev09/react-native-true-sheet', () => {
	const { forwardRef, useImperativeHandle } = jest.requireActual('react');
	const { View: MockView } = jest.requireActual('react-native');
	const TrueSheet = forwardRef((props: object, ref: Ref<unknown>) => {
		useImperativeHandle(ref, () => ({
			present: () => Promise.resolve(),
			dismiss: () => Promise.resolve(),
			resize: mockResize
		}));
		return <MockView {...props} />;
	});
	TrueSheet.displayName = 'TrueSheet';
	return { __esModule: true, TrueSheet, TrueSheetProvider: ({ children }: { children: unknown }) => children };
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

describe('ActionSheet', () => {
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
				utils.UNSAFE_getByProps({ cornerRadius: 16 }).props[handler]({ nativeEvent: { index, position, detent: 0.9 } });
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
