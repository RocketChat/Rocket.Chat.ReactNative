import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import BottomSheetContent from './BottomSheetContent';
import { type TActionSheetOptionsItem } from './Provider';

// The sheet is sized (its detent) with a reserved bottom inset and the scrollable
// content must be padded with the SAME value, otherwise the last option overflows
// the too-short sheet and gets clipped behind the navigation bar — the Samsung bug
// this guards against. Lock that the FlatList padding equals contentPaddingBottom.
const options: TActionSheetOptionsItem[] = [
	{ title: 'Forward', onPress: jest.fn() },
	{ title: 'Copy', onPress: jest.fn() }
];

describe('BottomSheetContent — options bottom spacing', () => {
	it('pads the option list with exactly the reserved bottom inset', () => {
		render(
			<BottomSheetContent options={options} hide={jest.fn()} onLayout={jest.fn()} contentPaddingBottom={96} scrollEnabled />
		);

		const style = StyleSheet.flatten(screen.getByTestId('action-sheet').props.contentContainerStyle);
		expect(style.paddingBottom).toBe(96);
	});

	it('defaults to no extra padding when no inset is reserved', () => {
		render(<BottomSheetContent options={options} hide={jest.fn()} onLayout={jest.fn()} scrollEnabled />);

		const style = StyleSheet.flatten(screen.getByTestId('action-sheet').props.contentContainerStyle);
		expect(style.paddingBottom).toBe(0);
	});
});
