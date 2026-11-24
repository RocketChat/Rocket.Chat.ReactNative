import { showErrorAlert } from '~/lib/methods/helpers/info';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsConference } from '~/lib/services/restApi';
import { joinEscalatedConference } from './conferenceEscalation';
import { useCallStore } from './useCallStore';

jest.mock('~/lib/services/restApi', () => ({ mediaCallsConference: jest.fn() }));
jest.mock('~/lib/methods/videoConf', () => ({ videoConfJoin: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('./useCallStore', () => ({ useCallStore: { getState: jest.fn() } }));

const mockEndCall = jest.fn();
const setCallState = (state: { callId: string | null; roomId: string | null }) =>
	jest.mocked(useCallStore.getState).mockReturnValue({ ...state, endCall: mockEndCall } as any);

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
