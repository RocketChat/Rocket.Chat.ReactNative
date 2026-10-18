import { renderHook } from '@testing-library/react-native';

import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { onConferenceNotificationAction } from '~/lib/services/conference/conferenceForegroundService';
import { useConferenceNotificationActions } from '../useConferenceNotificationActions';

const mockActions = { remove: jest.fn() };

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({
	conferenceSession: { toggleMicrophone: jest.fn(() => Promise.resolve()) }
}));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ closeConferenceCall: jest.fn() }));
jest.mock('~/lib/services/conference/conferenceForegroundService', () => ({
	onConferenceNotificationAction: jest.fn(() => mockActions)
}));

const press = (action: string) => jest.mocked(onConferenceNotificationAction).mock.calls[0][0](action as 'leave');

describe('useConferenceNotificationActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('mutes or unmutes the microphone when the notification button is pressed', () => {
		renderHook(() => useConferenceNotificationActions());

		press('toggleMic');

		expect(conferenceSession.toggleMicrophone).toHaveBeenCalledTimes(1);
		expect(closeConferenceCall).not.toHaveBeenCalled();
	});

	it('leaves the call when the leave button is pressed', () => {
		renderHook(() => useConferenceNotificationActions());

		press('leave');

		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
		expect(conferenceSession.toggleMicrophone).not.toHaveBeenCalled();
	});

	it('ignores a button it does not know', () => {
		renderHook(() => useConferenceNotificationActions());

		press('somethingElse');

		expect(closeConferenceCall).not.toHaveBeenCalled();
		expect(conferenceSession.toggleMicrophone).not.toHaveBeenCalled();
	});

	it('stops listening when the guard goes away', () => {
		const { unmount } = renderHook(() => useConferenceNotificationActions());

		unmount();

		expect(mockActions.remove).toHaveBeenCalledTimes(1);
	});
});
