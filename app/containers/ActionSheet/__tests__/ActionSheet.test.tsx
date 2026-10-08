import { act, render, screen } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Text, View } from 'react-native';

import { ActionSheetProvider, hideActionSheetRef, showActionSheetRef } from '../Provider';

const finishDismiss = () => act(() => screen.UNSAFE_getByType(TrueSheet).props.onDidDismiss());

describe('ActionSheet', () => {
	beforeEach(() => {
		jest.useFakeTimers();
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
		act(() => hideActionSheetRef());
		finishDismiss();
		act(() => showActionSheetRef({ children: <Text>second sheet</Text> }));

		expect(screen.getByText('second sheet')).toBeOnTheScreen();
	});
});
