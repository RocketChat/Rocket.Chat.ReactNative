import { act, render, screen } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Text, View } from 'react-native';

import { ActionSheetProvider, hideActionSheetRef, showActionSheetRef } from '../Provider';

const mockPresent = jest.fn((): Promise<void> => Promise.resolve());
const mockDismiss = jest.fn(() => Promise.resolve());

jest.mock('@lodev09/react-native-true-sheet', () => {
	const { forwardRef, useImperativeHandle } = require('react');
	const { View: MockView } = require('react-native');
	const MockTrueSheet = forwardRef(({ children }: { children: unknown }, ref: unknown) => {
		useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
		return <MockView>{children}</MockView>;
	});
	MockTrueSheet.displayName = 'TrueSheet';
	return { __esModule: true, TrueSheet: MockTrueSheet };
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
