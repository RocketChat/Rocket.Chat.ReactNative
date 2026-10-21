import { renderHook } from '@testing-library/react-native';

import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { onConferenceCallNotificationAction } from '~/lib/services/conference/conferenceCallNotification';
import { useConferenceNotificationActions } from '../useConferenceNotificationActions';

const mockActions = { remove: jest.fn() };

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({
	conferenceSession: { setMicrophone: jest.fn(() => Promise.resolve()) }
}));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ closeConferenceCall: jest.fn() }));
jest.mock('~/lib/services/conference/conferenceCallNotification', () => ({
	onConferenceCallNotificationAction: jest.fn(() => mockActions)
}));

const press = (action: string) => jest.mocked(onConferenceCallNotificationAction).mock.calls[0][0](action as 'leave');

describe('useConferenceNotificationActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('mutes the microphone when the mute button is pressed', () => {
		renderHook(() => useConferenceNotificationActions());

		press('mute');

		expect(conferenceSession.setMicrophone).toHaveBeenCalledTimes(1);
		expect(conferenceSession.setMicrophone).toHaveBeenCalledWith(false);
		expect(closeConferenceCall).not.toHaveBeenCalled();
	});

	it('unmutes the microphone when the unmute button is pressed', () => {
		renderHook(() => useConferenceNotificationActions());

		press('unmute');

		expect(conferenceSession.setMicrophone).toHaveBeenCalledTimes(1);
		expect(conferenceSession.setMicrophone).toHaveBeenCalledWith(true);
		expect(closeConferenceCall).not.toHaveBeenCalled();
	});

	it('leaves the call when the leave button is pressed', () => {
		renderHook(() => useConferenceNotificationActions());

		press('leave');

		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
		expect(conferenceSession.setMicrophone).not.toHaveBeenCalled();
	});

	it('ignores a button it does not know', () => {
		renderHook(() => useConferenceNotificationActions());

		press('somethingElse');

		expect(closeConferenceCall).not.toHaveBeenCalled();
		expect(conferenceSession.setMicrophone).not.toHaveBeenCalled();
	});

	it('stops listening when the guard goes away', () => {
		const { unmount } = renderHook(() => useConferenceNotificationActions());

		unmount();

		expect(mockActions.remove).toHaveBeenCalledTimes(1);
	});
});
