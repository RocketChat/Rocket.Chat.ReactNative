import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import ListPicker from './ListPicker';

// Non-zero bottom inset: the action sheet (TrueSheet / BottomSheetContent) already
// applies the bottom safe-area inset to its content, so the picker content must NOT
// add its own `marginBottom: insets.bottom` — doing so double-counts and leaves a
// blank band at the bottom of the sheet (the bug this guards against). With the inset
// mocked to 34, a regression that re-adds the margin would surface as marginBottom: 34.
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 })
}));

jest.mock('../../containers/ActionSheet', () => ({ useActionSheet: jest.fn() }));
const mockUseActionSheet = require('../../containers/ActionSheet').useActionSheet as jest.Mock;

describe('MediaAutoDownloadView ListPicker — action sheet bottom spacing', () => {
	const showActionSheet = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseActionSheet.mockReturnValue({ showActionSheet, hideActionSheet: jest.fn() });
	});

	it('does not bake the bottom safe-area inset into the sheet content', () => {
		render(<ListPicker value='wifi' title='Images' testID='media-picker' onChangeValue={jest.fn()} />);

		fireEvent.press(screen.getByTestId('media-picker'));

		expect(showActionSheet).toHaveBeenCalledTimes(1);
		const { children } = showActionSheet.mock.calls[0][0];
		const style = StyleSheet.flatten(children.props.style);
		// Neither margin nor padding: this view drops the inset entirely, so a
		// margin->padding swap would still inflate the bottom spacing and must fail.
		expect(style.marginBottom).toBeUndefined();
		expect(style.paddingBottom).toBeUndefined();
	});
});
