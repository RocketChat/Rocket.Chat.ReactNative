import { act, renderHook } from '@testing-library/react-native';

import {
	onConferencePictureInPictureChanged,
	setConferencePictureInPictureEnabled
} from '~/lib/services/conference/conferencePictureInPicture';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferencePictureInPicture } from '../useConferencePictureInPicture';

const mockSubscription = { remove: jest.fn() };

jest.mock('~/lib/services/conference/conferencePictureInPicture', () => ({
	setConferencePictureInPictureEnabled: jest.fn(),
	onConferencePictureInPictureChanged: jest.fn(() => mockSubscription)
}));

const enable = setConferencePictureInPictureEnabled as jest.Mock;
const subscribe = onConferencePictureInPictureChanged as jest.Mock;
const reportModeChange = (inPictureInPicture: boolean) => act(() => subscribe.mock.calls[0][0](inPictureInPicture));

describe('useConferencePictureInPicture', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConferenceCallStore.getState().setPictureInPicture(false);
	});

	it('allows the window while the call screen is open', () => {
		renderHook(() => useConferencePictureInPicture(true));

		expect(enable).toHaveBeenCalledTimes(1);
		expect(enable).toHaveBeenCalledWith(true);
	});

	it('does not allow the window while the call is minimized', () => {
		renderHook(() => useConferencePictureInPicture(false));

		expect(enable).not.toHaveBeenCalled();
		expect(subscribe).not.toHaveBeenCalled();
	});

	it('takes the permission back when the call screen is minimized', () => {
		const { rerender } = renderHook(({ eligible }: { eligible: boolean }) => useConferencePictureInPicture(eligible), {
			initialProps: { eligible: true }
		});

		rerender({ eligible: false });

		expect(enable).toHaveBeenLastCalledWith(false);
		expect(mockSubscription.remove).toHaveBeenCalledTimes(1);
	});

	it('takes the permission back when the call screen goes away', () => {
		const { unmount } = renderHook(() => useConferencePictureInPicture(true));

		unmount();

		expect(enable).toHaveBeenLastCalledWith(false);
		expect(mockSubscription.remove).toHaveBeenCalledTimes(1);
	});

	it('says whether the window is showing', () => {
		const { result } = renderHook(() => useConferencePictureInPicture(true));
		expect(result.current).toBe(false);

		reportModeChange(true);
		expect(result.current).toBe(true);

		reportModeChange(false);
		expect(result.current).toBe(false);
	});

	it('stops saying the window is showing once the call screen is minimized', () => {
		const { result, rerender } = renderHook(({ eligible }: { eligible: boolean }) => useConferencePictureInPicture(eligible), {
			initialProps: { eligible: true }
		});
		reportModeChange(true);

		rerender({ eligible: false });

		expect(result.current).toBe(false);
	});

	it('tells the rest of the app, not just the call screen, that the window is showing', () => {
		renderHook(() => useConferencePictureInPicture(true));

		reportModeChange(true);
		expect(useConferenceCallStore.getState().pictureInPicture).toBe(true);

		reportModeChange(false);
		expect(useConferenceCallStore.getState().pictureInPicture).toBe(false);
	});

	it('takes the rest of the app out of picture in picture when the call screen goes away', () => {
		const { unmount } = renderHook(() => useConferencePictureInPicture(true));
		reportModeChange(true);

		unmount();

		expect(useConferenceCallStore.getState().pictureInPicture).toBe(false);
	});
});
