import { Alert } from 'react-native';

import openLink from '~/lib/methods/helpers/openLink';
import Navigation from '~/lib/navigation/appNavigation';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsEscalate, notifyUser, videoConferenceStart } from '~/lib/services/restApi';
import { escalateToVideo, joinConferenceFromPeer } from './escalateToVideo';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { useCallStore } from './useCallStore';

jest.mock('~/lib/services/restApi', () => ({
	mediaCallsEscalate: jest.fn(),
	notifyUser: jest.fn(),
	videoConferenceStart: jest.fn()
}));
jest.mock('~/lib/methods/videoConf', () => ({ videoConfJoin: jest.fn() }));
jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => ({ login: { user: { id: 'me' } }, server: { server: 'https://open.rocket.chat' } }) }
}));
jest.mock('~/lib/methods/helpers/openLink', () => jest.fn());
jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('~/lib/navigation/appNavigation', () => ({
	back: jest.fn(),
	navigate: jest.fn()
}));

const mockEscalate = jest.mocked(mediaCallsEscalate);
const mockStart = jest.mocked(videoConferenceStart);
const sipCall = { features: ['audio', 'conference-escalation'] } as any;
const mockOpenLink = jest.mocked(openLink);
const mockEndCall = jest.fn();
const mockToggleFocus = jest.fn();

const pressAlertButton = (index: number) => {
	const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
	return buttons[index].onPress!();
};

describe('escalateToVideo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		useCallStore.setState({
			call: sipCall,
			callId: 'call-1',
			roomId: 'room-1',
			focused: true,
			escalated: false,
			endCall: mockEndCall,
			toggleFocus: mockToggleFocus
		});
		usePexipCallStore.getState().leave();
	});

	it('does nothing without an active call', () => {
		useCallStore.setState({ callId: null });
		escalateToVideo();
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('keeps the call when the user cancels', () => {
		escalateToVideo();
		const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
		expect(buttons[0].style).toBe('cancel');
		expect(mockEscalate).not.toHaveBeenCalled();
	});

	it('keeps the voice call, leaves CallView and joins pexip in the in-app overlay on confirm', async () => {
		mockEscalate.mockResolvedValue({
			success: true,
			url: 'https://pexip.example/conf',
			providerName: 'core.pexip',
			callId: 'conf-1'
		} as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEscalate).toHaveBeenCalledWith('call-1');
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(mockToggleFocus).toHaveBeenCalledTimes(1);
		expect(usePexipCallStore.getState().call).toMatchObject({
			callId: 'conf-1',
			url: 'https://pexip.example/conf',
			rid: 'room-1'
		});
		expect(mockOpenLink).not.toHaveBeenCalled();
	});

	it('joins without asking again once the call was escalated', async () => {
		useCallStore.setState({ escalated: true });
		mockEscalate.mockResolvedValue({
			success: true,
			url: 'https://pexip.example/conf',
			providerName: 'core.pexip'
		} as any);
		escalateToVideo();
		await new Promise(process.nextTick);
		expect(Alert.alert).not.toHaveBeenCalled();
		expect(mockEscalate).toHaveBeenCalledWith('call-1');
		expect(usePexipCallStore.getState().call).toMatchObject({
			callId: 'call-1',
			url: 'https://pexip.example/conf'
		});
	});

	it('ends the voice call and opens other providers externally', async () => {
		mockEscalate.mockResolvedValue({
			success: true,
			url: 'https://bbb.example/conf',
			providerName: 'bbb'
		} as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(Navigation.back).toHaveBeenCalledTimes(1);
		expect(mockEndCall.mock.invocationCallOrder[0]).toBeLessThan(mockOpenLink.mock.invocationCallOrder[0]);
		expect(mockOpenLink).toHaveBeenCalledWith('https://bbb.example/conf');
	});

	it('joins jitsi conferences in-app', async () => {
		mockEscalate.mockResolvedValue({
			success: true,
			url: 'https://jitsi.example/conf',
			providerName: 'jitsi'
		} as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(Navigation.navigate).toHaveBeenCalledWith('JitsiMeetView', {
			url: 'https://jitsi.example/conf',
			onlyAudio: false,
			videoConf: true
		});
		expect(mockOpenLink).not.toHaveBeenCalled();
	});

	it('does not leave CallView again when the server already ended the voice call', async () => {
		mockEscalate.mockImplementation(() => {
			useCallStore.setState({ callId: null });
			return Promise.resolve({
				success: true,
				url: 'https://pexip.example/conf',
				providerName: 'core.pexip'
			} as any);
		});
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockToggleFocus).not.toHaveBeenCalled();
		expect(usePexipCallStore.getState().call).toMatchObject({
			callId: 'call-1',
			url: 'https://pexip.example/conf'
		});
	});

	it('shows an error when escalation fails', async () => {
		mockEscalate.mockRejectedValue(new Error('boom'));
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(mockOpenLink).not.toHaveBeenCalled();
		expect(Alert.alert).toHaveBeenLastCalledWith('', 'Unable to start video call', expect.anything(), expect.anything());
	});
});

describe('escalateToVideo between two users', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		useCallStore.setState({
			call: { features: ['audio'] } as any,
			callId: 'call-1',
			contact: { id: 'peer-1', username: 'peer' },
			roomId: 'dm-1',
			focused: true,
			escalated: false,
			endCall: mockEndCall,
			toggleFocus: mockToggleFocus
		});
	});

	it('does nothing when the DM is unknown', () => {
		useCallStore.setState({ roomId: null });
		escalateToVideo();
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('starts a conference in the DM without ringing, tells the other user and joins it', async () => {
		mockStart.mockResolvedValue({ success: true, data: { type: 'videoconference', callId: 'conf-1' } } as any);
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEscalate).not.toHaveBeenCalled();
		expect(mockStart).toHaveBeenCalledWith('dm-1', false);
		expect(notifyUser).toHaveBeenCalledWith('peer-1/video-conference', {
			action: 'escalate',
			params: { uid: 'me', rid: 'dm-1', callId: 'conf-1' }
		});
		expect(jest.mocked(notifyUser).mock.invocationCallOrder[0]).toBeLessThan(mockEndCall.mock.invocationCallOrder[0]);
		expect(Navigation.back).toHaveBeenCalledTimes(1);
		expect(videoConfJoin).toHaveBeenCalledWith('conf-1', false, true, { rid: 'dm-1' });
	});

	it('asks again even if the server flagged the call as escalated', () => {
		useCallStore.setState({ escalated: true });
		escalateToVideo();
		expect(Alert.alert).toHaveBeenCalledTimes(1);
	});

	it('keeps the voice call when the conference cannot be started', async () => {
		mockStart.mockRejectedValue(new Error('no-active-video-conf-provider'));
		escalateToVideo();
		await pressAlertButton(1);
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(notifyUser).not.toHaveBeenCalled();
		expect(videoConfJoin).not.toHaveBeenCalled();
		expect(Alert.alert).toHaveBeenLastCalledWith('', 'Unable to start video call', expect.anything(), expect.anything());
	});
});

describe('joinConferenceFromPeer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useCallStore.setState({
			call: { features: ['audio'] } as any,
			callId: 'call-1',
			contact: { id: 'peer-1', username: 'peer' },
			focused: true,
			endCall: mockEndCall
		});
	});

	it('leaves the voice call and joins the conference the other user switched to', async () => {
		await joinConferenceFromPeer({ callId: 'conf-1', rid: 'dm-1', uid: 'peer-1' });
		expect(mockEndCall).toHaveBeenCalledTimes(1);
		expect(Navigation.back).toHaveBeenCalledTimes(1);
		expect(videoConfJoin).toHaveBeenCalledWith('conf-1', false, true, { rid: 'dm-1' });
	});

	it('ignores it from anyone but the user on the voice call', async () => {
		await joinConferenceFromPeer({ callId: 'conf-1', rid: 'dm-2', uid: 'someone-else' });
		expect(mockEndCall).not.toHaveBeenCalled();
		expect(videoConfJoin).not.toHaveBeenCalled();
	});

	it('ignores it without a voice call', async () => {
		useCallStore.setState({ call: null });
		await joinConferenceFromPeer({ callId: 'conf-1', rid: 'dm-1', uid: 'peer-1' });
		expect(videoConfJoin).not.toHaveBeenCalled();
	});
});
