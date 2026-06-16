import { render, screen } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';

import DirectoryOptions from './Options';

// The directory filter is shown as action-sheet content. The sheet already applies the
// bottom safe-area inset, so the List.Container must not add `marginBottom: insets.bottom`
// (double-counting leaves a blank band — the bug this guards against). Inset mocked to a
// non-zero value so a regression re-adding the margin would surface as marginBottom: 34.
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 })
}));

describe('DirectoryView Options — action sheet bottom spacing', () => {
	it('does not bake the bottom safe-area inset into the list container', () => {
		render(
			<DirectoryOptions
				type='channels'
				globalUsers={false}
				isFederationEnabled={false}
				changeType={jest.fn()}
				toggleWorkspace={jest.fn()}
			/>
		);

		const container = screen.UNSAFE_getByType(ScrollView);
		const style = StyleSheet.flatten(container.props.contentContainerStyle);
		// Neither margin nor padding: this view drops the inset entirely, so a
		// margin->padding swap would still inflate the bottom spacing and must fail.
		expect(style.marginBottom).toBeUndefined();
		expect(style.paddingBottom).toBeUndefined();
	});
});
