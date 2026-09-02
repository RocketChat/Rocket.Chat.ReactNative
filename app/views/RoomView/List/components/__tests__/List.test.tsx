import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react-native';

import List from '../List';
import { ComposerStoreProvider, useUpdateAutocompleteVisible } from '../../../../../containers/MessageComposer/store';

let updateAutocompleteVisible: (isVisible: boolean) => void;

const AutocompleteToggle = () => {
	updateAutocompleteVisible = useUpdateAutocompleteVisible();
	return null;
};

const messageList = () => screen.getByTestId('room-view-messages', { includeHiddenElements: true });

describe('List', () => {
	it('hides the message list from accessibility while the autocomplete is visible', async () => {
		render(
			<ComposerStoreProvider>
				<AutocompleteToggle />
				<List flatListRef={createRef()} jumpToBottom={jest.fn()} data={[]} renderItem={() => null} />
			</ComposerStoreProvider>
		);
		await act(async () => {});

		expect(messageList().props.accessibilityElementsHidden).toBe(false);
		expect(messageList().props.importantForAccessibility).toBe('yes');

		act(() => updateAutocompleteVisible(true));

		expect(messageList().props.accessibilityElementsHidden).toBe(true);
		expect(messageList().props.importantForAccessibility).toBe('no-hide-descendants');
	});
});
