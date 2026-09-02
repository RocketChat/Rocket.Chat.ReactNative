import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { type ReactNode } from 'react';

import { useAutocompleteA11yAnnounce } from '../useAutocompleteA11yAnnounce';
import { createComposerStore, type ComposerStore, ComposerStoreContext } from '../../../store';

const setup = () => {
	const store: ComposerStore = createComposerStore();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ComposerStoreContext.Provider value={store}>{children}</ComposerStoreContext.Provider>
	);
	const view = renderHook(() => useAutocompleteA11yAnnounce(), { wrapper });
	return { store, ...view };
};

describe('useAutocompleteA11yAnnounce', () => {
	let announceSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
	});

	afterEach(() => {
		announceSpy.mockRestore();
		jest.useRealTimers();
	});

	it('announces 800ms after a false→true transition', () => {
		const { store } = setup();

		act(() => store.getState().updateAutocompleteVisible(true));
		expect(announceSpy).not.toHaveBeenCalled();

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).toHaveBeenCalledTimes(1);
	});

	it('clears the pending timeout when visibility flips back before 800ms', () => {
		const { store } = setup();

		act(() => store.getState().updateAutocompleteVisible(true));
		act(() => jest.advanceTimersByTime(400));
		act(() => store.getState().updateAutocompleteVisible(false));

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).not.toHaveBeenCalled();
	});

	it('clears the pending timeout on unmount', () => {
		const { store, unmount } = setup();

		act(() => store.getState().updateAutocompleteVisible(true));
		unmount();

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).not.toHaveBeenCalled();
	});
});
