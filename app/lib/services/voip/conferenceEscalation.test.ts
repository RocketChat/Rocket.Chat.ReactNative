import { showErrorAlert } from '~/lib/methods/helpers/info';
import UserPreferences from '~/lib/methods/userPreferences';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsConference } from '~/lib/services/restApi';
import { getSupportedCallFeatures, joinEscalatedConference, watchConferenceEscalation } from './conferenceEscalation';
import { useCallStore } from './useCallStore';

const mockState = {
	settings: { VoIP_TeamCollab_Video_Escalation_Enabled: false as boolean | undefined },
	server: { server: 'https://open.rocket.chat' }
};
const mockListeners: (() => void)[] = [];
jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: () => mockState,
		subscribe: (listener: () => void) => {
			mockListeners.push(listener);
			return jest.fn();
		}
	}
}));
jest.mock('~/lib/methods/userPreferences', () => ({ setString: jest.fn(), removeItem: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ mediaCallsConference: jest.fn() }));
jest.mock('~/lib/methods/videoConf', () => ({ videoConfJoin: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('./useCallStore', () => ({ useCallStore: { getState: jest.fn() } }));

const mockEndCall = jest.fn();
const setCallState = (state: { callId: string | null; roomId: string | null }) =>
	jest.mocked(useCallStore.getState).mockReturnValue({ ...state, endCall: mockEndCall } as any);

describe('getSupportedCallFeatures', () => {
	it('leaves conference-escalation out unless the server enables it', () => {
		mockState.settings.VoIP_TeamCollab_Video_Escalation_Enabled = undefined;
		expect(getSupportedCallFeatures()).toEqual(['audio', 'hold']);
		mockState.settings.VoIP_TeamCollab_Video_Escalation_Enabled = true;
		expect(getSupportedCallFeatures()).toEqual(['audio', 'hold', 'conference-escalation']);
	});
});

describe('watchConferenceEscalation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockListeners.length = 0;
	});

	it('stores the flag for the current server and clears it when disabled', () => {
		mockState.settings.VoIP_TeamCollab_Video_Escalation_Enabled = true;
		watchConferenceEscalation();
		expect(UserPreferences.setString).toHaveBeenCalledWith('https://open.rocket.chat-RC_VOIP_CONFERENCE_ESCALATION', 'true');

		mockState.settings.VoIP_TeamCollab_Video_Escalation_Enabled = false;
		mockListeners[0]();
		expect(UserPreferences.removeItem).toHaveBeenCalledWith('https://open.rocket.chat-RC_VOIP_CONFERENCE_ESCALATION');
	});

	it('does not rewrite an unchanged value', () => {
		mockState.settings.VoIP_TeamCollab_Video_Escalation_Enabled = true;
		watchConferenceEscalation();
		mockListeners[0]();
		expect(UserPreferences.setString).toHaveBeenCalledTimes(1);
	});
});

describe('joinEscalatedConference', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('ends the voice call and joins the conference the call was escalated into', async () => {
		setCallState({ callId: 'call-1', roomId: 'dm-1' });
		jest.mocked(mediaCallsConference).mockResolvedValue({
			success: true,
			conferenceId: 'conf-1',
			providerName: 'pexip',
			url: 'https://pexip.example/conf'
		} as any);
		await joinEscalatedConference();
		expect(mediaCallsConference).toHaveBeenCalledWith('call-1');
		expect(mockEndCall).toHaveBeenCalledTimes(1);
		expect(videoConfJoin).toHaveBeenCalledWith('conf-1', false, true, { rid: 'dm-1' });
		expect(mockEndCall.mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(videoConfJoin).mock.invocationCallOrder[0]);
	});

	it('keeps the voice call when the conference lookup fails', async () => {
		setCallState({ callId: 'call-1', roomId: 'dm-1' });
		jest.mocked(mediaCallsConference).mockRejectedValue(new Error('not found'));
		await joinEscalatedConference();
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(videoConfJoin).not.toHaveBeenCalled();
		expect(showErrorAlert).toHaveBeenCalled();
	});

	it('does nothing without a call', async () => {
		setCallState({ callId: null, roomId: null });
		await joinEscalatedConference();
		expect(mediaCallsConference).not.toHaveBeenCalled();
	});
});
