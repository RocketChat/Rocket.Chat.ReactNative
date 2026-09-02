import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { type ReactNode } from 'react';

import { useAutocompleteA11yAnnounce } from '../useAutocompleteA11yAnnounce';
import { ComposerStoreProvider, useUpdateAutocompleteVisible } from '../../../store';

const setup = () => {
	const wrapper = ({ children }: { children: ReactNode }) => <ComposerStoreProvider>{children}</ComposerStoreProvider>;
	return renderHook(
		() => {
			useAutocompleteA11yAnnounce();
			return useUpdateAutocompleteVisible();
		},
		{ wrapper }
	);
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
		const { result } = setup();

		act(() => result.current(true));
		expect(announceSpy).not.toHaveBeenCalled();

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).toHaveBeenCalledTimes(1);
	});

	it('clears the pending timeout when visibility flips back before 800ms', () => {
		const { result } = setup();

		act(() => result.current(true));
		act(() => jest.advanceTimersByTime(400));
		act(() => result.current(false));

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).not.toHaveBeenCalled();
	});

	it('clears the pending timeout on unmount', () => {
		const { result, unmount } = setup();

		act(() => result.current(true));
		unmount();

		act(() => jest.advanceTimersByTime(800));
		expect(announceSpy).not.toHaveBeenCalled();
	});
});
