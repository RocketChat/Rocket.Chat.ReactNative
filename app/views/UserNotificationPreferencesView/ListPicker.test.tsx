import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import ListPicker from './ListPicker';

// The sheet already applies the bottom safe-area inset to its content, so the picker
// content must not add a `marginBottom: insets.bottom` (that double-counts and leaves
// a blank band — the bug this guards against). This view intentionally keeps a
// `paddingBottom` for now, so the guard is specifically on marginBottom. Inset mocked
// to 34 so a regression re-adding the margin would surface as marginBottom: 34.
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 })
}));

jest.mock('../../containers/ActionSheet', () => ({ useActionSheet: jest.fn() }));
const mockUseActionSheet = require('../../containers/ActionSheet').useActionSheet as jest.Mock;

describe('UserNotificationPreferencesView ListPicker — action sheet bottom spacing', () => {
	const showActionSheet = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseActionSheet.mockReturnValue({ showActionSheet, hideActionSheet: jest.fn() });
	});

	it('does not bake the bottom safe-area inset as a margin into the sheet content', () => {
		render(
			<ListPicker preference='desktopNotifications' value='all' title='Alert' testID='notif-picker' onChangeValue={jest.fn()} />
		);

		fireEvent.press(screen.getByTestId('notif-picker'));

		expect(showActionSheet).toHaveBeenCalledTimes(1);
		const { children } = showActionSheet.mock.calls[0][0];
		const style = StyleSheet.flatten(children.props.style);
		expect(style.marginBottom).toBeUndefined();
		// This view intentionally keeps the bottom safe-area inset as padding, so lock that contract.
		expect(style.paddingBottom).toBe(34);
	});
});
