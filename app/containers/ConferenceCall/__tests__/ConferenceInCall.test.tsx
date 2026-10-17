import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { addSettings, clearSettings } from '~/actions/settings';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useRoomUnread } from '~/lib/hooks/useRoomUnread';
import { ensureCameraPermission } from '~/lib/methods/ensureCameraPermission';
import { showToast } from '~/lib/methods/helpers/showToast';
import { createReaction } from '~/lib/services/conference/callDataProtocol';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { navigateToConferenceChat } from '~/lib/services/conference/navigateToConferenceChat';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import ConferenceInCall from '../ConferenceInCall';
import { useConferencePictureInPicture } from '../useConferencePictureInPicture';
import { useSpeakingWhileMuted } from '../useSpeakingWhileMuted';

type TMockParticipant = { identity: string; name: string; isLocal: boolean; isAgent?: boolean };

const mockLiveKit = {
	local: {
		localParticipant: { identity: 'me', setMicrophoneEnabled: jest.fn(), setCameraEnabled: jest.fn() },
		isMicrophoneEnabled: true,
		isCameraEnabled: false
	},
	participants: [] as TMockParticipant[],
	speakers: [] as { identity: string; isLocal: boolean; audioLevel: number }[],
	cameraTracks: [] as { participant: TMockParticipant; publication: { isMuted: boolean; track?: object } }[],
	micTracks: [] as { participant: TMockParticipant; publication: { isMuted: boolean; track?: object } }[]
};

const mockTileSpeakingMonitor = jest.fn((_props: unknown) => null);

const mockMenus = {
	showPeople: jest.fn(),
	showReactions: jest.fn(),
	showAudioOutput: jest.fn(),
	showCameraOptions: jest.fn(),
	showMore: jest.fn(),
	showChatAccess: jest.fn()
};

jest.mock('@livekit/react-native', () => {
	const { createElement } = jest.requireActual('react');
	const { View: MockView } = jest.requireActual('react-native');
	return {
		isTrackReference: (track?: { publication?: unknown }) => !!track?.publication,
		RoomContext: { Provider: ({ children }: { children: unknown }) => children },
		useLocalParticipant: () => mockLiveKit.local,
		useParticipants: () => mockLiveKit.participants,
		useSpeakingParticipants: () => mockLiveKit.speakers,
		useTracks: (sources: { source: string }[]) =>
			sources[0].source === 'camera' ? mockLiveKit.cameraTracks : mockLiveKit.micTracks,
		VideoTrack: () => createElement(MockView, { testID: 'video-track' })
	};
});
jest.mock('@livekit/react-native-webrtc', () => ({ ScreenCapturePickerView: () => null }));
jest.mock('~/lib/services/conference/livekit', () => ({ Track: { Source: { Camera: 'camera', Microphone: 'microphone' } } }));
jest.mock('../useConferenceMenus', () => ({ useConferenceMenus: () => mockMenus }));
jest.mock('../useConferencePictureInPicture', () => ({ useConferencePictureInPicture: jest.fn(() => false) }));
jest.mock('../useSpeakingWhileMuted', () => ({ useSpeakingWhileMuted: jest.fn(() => false) }));
jest.mock('../TileSpeakingMonitor', () => ({ __esModule: true, default: (props: unknown) => mockTileSpeakingMonitor(props) }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: jest.fn() }));
jest.mock('~/lib/hooks/useRoomUnread', () => ({ useRoomUnread: jest.fn(() => 0) }));
jest.mock('~/lib/methods/ensureCameraPermission', () => ({ ensureCameraPermission: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({
	conferenceSession: {
		toggleHand: jest.fn(),
		setMicrophone: jest.fn(() => Promise.resolve()),
		setCamera: jest.fn(() => Promise.resolve()),
		selectAudioOutput: jest.fn(() => Promise.resolve())
	}
}));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ closeConferenceCall: jest.fn() }));
jest.mock('~/lib/services/conference/navigateToConferenceChat', () => ({
	navigateToConferenceChat: jest.fn(() => Promise.resolve())
}));

const infoMock = useConferenceInfo as jest.Mock;
const pictureInPictureMock = useConferencePictureInPicture as jest.Mock;
const speakingWhileMutedMock = useSpeakingWhileMuted as jest.Mock;

const person = (identity: string, extra: Partial<TMockParticipant> = {}): TMockParticipant => ({
	identity,
	name: identity === 'me' ? 'Me Myself' : `${identity[0].toUpperCase()}${identity.slice(1)}`,
	isLocal: identity === 'me',
	...extra
});

const liveVideo = (participant: TMockParticipant) => ({ participant, publication: { isMuted: false, track: {} } });
const openMic = (participant: TMockParticipant) => ({ participant, publication: { isMuted: false } });

const renderCall = () =>
	render(
		<Provider store={mockedStore}>
			<ConferenceInCall />
		</Provider>
	);

const callInfo = (extra: object = {}) => ({
	info: {
		title: 'Standup',
		users: [
			{ _id: 'me', joined: true },
			{ _id: 'ada', joined: true },
			{ _id: 'bob', joined: true, leftAt: '2026-10-15T08:00:00.000Z' }
		],
		chatAccess: { rid: 'GENERAL', name: 'general', type: 'c', membersWithoutAccess: [], canInvite: true },
		messages: {},
		...extra
	},
	loading: false,
	failed: false,
	reload: jest.fn()
});

const measureStage = (getByTestId: (id: string) => unknown) =>
	fireEvent(getByTestId('conference-stage') as never, 'layout', { nativeEvent: { layout: { width: 393, height: 600 } } });

describe('ConferenceInCall', () => {
	const me = person('me');
	const ada = person('ada');

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(clearSettings());
		useConferenceCallStore.getState().close();
		useConferenceCallStore.getState().open({ callId: 'call1', rid: 'GENERAL' });
		useConferenceCallStore.getState().setPhase('connected');
		useConferenceInteractionStore.getState().reset();
		useConferenceInteractionStore.getState().setVideoQuality('auto');
		useConferenceRoomStore.getState().setRoom({} as never);
		mockLiveKit.local = {
			localParticipant: {
				identity: 'me',
				setMicrophoneEnabled: jest.fn(() => Promise.resolve()),
				setCameraEnabled: jest.fn(() => Promise.resolve())
			},
			isMicrophoneEnabled: true,
			isCameraEnabled: false
		};
		mockLiveKit.participants = [me, ada];
		mockLiveKit.speakers = [];
		mockLiveKit.cameraTracks = [];
		mockLiveKit.micTracks = [openMic(me), openMic(ada)];
		infoMock.mockReturnValue(callInfo());
		pictureInPictureMock.mockReturnValue(false);
		speakingWhileMutedMock.mockReturnValue(false);
		(useMasterDetail as jest.Mock).mockReturnValue(false);
		(useRoomUnread as jest.Mock).mockReturnValue(0);
		(ensureCameraPermission as jest.Mock).mockResolvedValue(true);
	});

	afterEach(() => {
		act(() => useConferenceRoomStore.getState().setRoom(undefined));
	});

	it('shows nothing until there is a room to show', () => {
		useConferenceRoomStore.getState().setRoom(undefined);

		const { queryByTestId } = renderCall();

		expect(queryByTestId('conference-in-call')).toBeNull();
	});

	describe('the people on the stage', () => {
		it('shows a tile for everyone in the room', () => {
			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			expect(getByTestId('conference-tile-me')).toBeTruthy();
			expect(getByTestId('conference-tile-ada')).toBeTruthy();
		});

		it('leaves out an agent, which is not a person in the call', () => {
			mockLiveKit.participants = [me, ada, person('agent-AJ_123', { isAgent: true })];
			const { getByTestId, queryByTestId } = renderCall();
			measureStage(getByTestId);

			expect(queryByTestId('conference-tile-agent-AJ_123')).toBeNull();
		});

		it('shows a muted microphone as muted and an open one as open', () => {
			mockLiveKit.micTracks = [openMic(me), { participant: ada, publication: { isMuted: true } }];
			const { getByTestId, getByLabelText } = renderCall();
			measureStage(getByTestId);

			expect(getByLabelText('Ada, Microphone muted')).toBeTruthy();
			expect(getByLabelText('Me Myself')).toBeTruthy();
		});

		it('treats someone who never published a microphone as muted', () => {
			mockLiveKit.micTracks = [openMic(me)];
			const { getByTestId, getByLabelText } = renderCall();
			measureStage(getByTestId);

			expect(getByLabelText('Ada, Microphone muted')).toBeTruthy();
		});

		it('shows live video where there is a camera, and a placeholder where there is none', () => {
			mockLiveKit.cameraTracks = [liveVideo(ada)];
			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			expect(within(getByTestId('conference-tile-ada')).getByTestId('video-track')).toBeTruthy();
			expect(within(getByTestId('conference-tile-me')).queryByTestId('video-track')).toBeNull();
		});

		it('does not show the video of a camera that was switched off', () => {
			mockLiveKit.cameraTracks = [{ participant: ada, publication: { isMuted: true, track: {} } }];
			const { getByTestId, queryByTestId } = renderCall();
			measureStage(getByTestId);

			expect(queryByTestId('video-track')).toBeNull();
		});

		it('shows the resolution being sent on our own tile once it is not automatic', () => {
			useConferenceInteractionStore.getState().setVideoQuality('h720');
			const { getByTestId, getByText } = renderCall();
			measureStage(getByTestId);

			expect(getByText('720p')).toBeTruthy();
		});

		it('shows a raised hand, in the order the hands went up', () => {
			useConferenceInteractionStore.getState().applyHandMessage('ada', { type: 'hand', raised: true, raisedAt: 10 }, 10);
			useConferenceInteractionStore.getState().applyHandMessage('me', { type: 'hand', raised: true, raisedAt: 20 }, 20);
			const { getByTestId, getByText } = renderCall();
			measureStage(getByTestId);

			expect(getByText('✋ (1) Ada')).toBeTruthy();
			expect(getByText('✋ (2) Me Myself')).toBeTruthy();
		});
	});

	describe('the header', () => {
		it('names the call and counts the people in it, not the people who left', () => {
			const { getByText, getByTestId } = renderCall();

			expect(getByText('Standup')).toBeTruthy();
			expect(getByTestId('conference-people-button')).toBeTruthy();
			expect(getByText('2')).toBeTruthy();
		});

		it('counts the people on screen until the call has been fetched', () => {
			infoMock.mockReturnValue({ info: undefined, loading: true, failed: false, reload: jest.fn() });

			const { getByText } = renderCall();

			expect(getByText('2')).toBeTruthy();
		});

		it('shows how long the call has run', () => {
			jest.useFakeTimers().setSystemTime(1_000_000);
			useConferenceCallStore.setState({ connectedAt: 1_000_000 - 74_000 });

			const { getByTestId } = renderCall();

			expect(getByTestId('conference-timer').props.children).toBe('01:14');
			jest.useRealTimers();
		});

		it('tells the user the call is reconnecting, and only then', () => {
			const { queryByTestId, rerender } = renderCall();
			expect(queryByTestId('conference-reconnecting')).toBeNull();

			act(() => useConferenceCallStore.getState().setPhase('reconnecting'));
			rerender(
				<Provider store={mockedStore}>
					<ConferenceInCall />
				</Provider>
			);

			expect(queryByTestId('conference-reconnecting')).not.toBeNull();
		});

		it('announces a raised hand beside the buttons, by the name of whoever is first in line', () => {
			useConferenceInteractionStore.getState().applyHandMessage('ada', { type: 'hand', raised: true, raisedAt: 10 }, 10);

			const { getByText } = renderCall();

			expect(getByText('✋ Ada')).toBeTruthy();
		});

		it('says "You" when the first hand is our own, and how many others are waiting', () => {
			useConferenceInteractionStore.getState().applyHandMessage('me', { type: 'hand', raised: true, raisedAt: 10 }, 10);
			useConferenceInteractionStore.getState().applyHandMessage('ada', { type: 'hand', raised: true, raisedAt: 20 }, 20);

			const { getByText } = renderCall();

			expect(getByText('✋ You +1')).toBeTruthy();
		});

		it('opens the list of people from the hand announcement', () => {
			useConferenceInteractionStore.getState().applyHandMessage('ada', { type: 'hand', raised: true, raisedAt: 10 }, 10);
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-hand-pill'));

			expect(mockMenus.showPeople).toHaveBeenCalledTimes(1);
		});

		it('opens the people list', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-people-button'));

			expect(mockMenus.showPeople).toHaveBeenCalledTimes(1);
		});
	});

	describe('the chat', () => {
		it('opens the room the call chats in, and does not hang up', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-button'));

			expect(navigateToConferenceChat).toHaveBeenCalledWith({
				chat: { rid: 'GENERAL', name: 'general', t: 'c' },
				isMasterDetail: false
			});
			expect(closeConferenceCall).not.toHaveBeenCalled();
		});

		it('opens the thread of the call message when the chat lives in a thread', () => {
			mockedStore.dispatch(
				addSettings({
					VideoConf_Enable_Persistent_Chat: true,
					VideoConf_Conference_Window_Enabled: true,
					VideoConf_Persistent_Chat_Mode: 'thread'
				})
			);
			infoMock.mockReturnValue(callInfo({ messages: { started: 'started-message' } }));
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-button'));

			expect(navigateToConferenceChat).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'started-message' }));
		});

		it('opens only the room when the chat lives in the room', () => {
			mockedStore.dispatch(
				addSettings({
					VideoConf_Enable_Persistent_Chat: true,
					VideoConf_Conference_Window_Enabled: true,
					VideoConf_Persistent_Chat_Mode: 'main_room'
				})
			);
			infoMock.mockReturnValue(callInfo({ messages: { started: 'started-message' } }));
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-button'));

			expect(navigateToConferenceChat).toHaveBeenCalledWith(expect.objectContaining({ threadId: undefined }));
		});

		it('passes on whether the app is showing the tablet layout', () => {
			(useMasterDetail as jest.Mock).mockReturnValue(true);
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-button'));

			expect(navigateToConferenceChat).toHaveBeenCalledWith(expect.objectContaining({ isMasterDetail: true }));
		});

		it('does nothing before it knows which room the chat is in', () => {
			infoMock.mockReturnValue({ info: undefined, loading: true, failed: false, reload: jest.fn() });
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-button'));

			expect(navigateToConferenceChat).not.toHaveBeenCalled();
		});
	});

	describe('the chat button', () => {
		it('shows how many messages are waiting in the room', () => {
			(useRoomUnread as jest.Mock).mockReturnValue(4);
			const { getByText } = renderCall();

			expect(getByText('4')).toBeTruthy();
		});

		it('looks up the unread count of the room the call chats in', () => {
			renderCall();

			expect(useRoomUnread).toHaveBeenCalledWith('GENERAL');
		});

		it('cannot be used before the call details are known', () => {
			infoMock.mockReturnValue({ info: undefined, loading: true, failed: false, reload: jest.fn() });
			const { getByTestId } = renderCall();

			expect(getByTestId('conference-chat-button').props.accessibilityState).toMatchObject({ disabled: true });
		});
	});

	describe('the speaker', () => {
		it('opens the choice of audio outputs from the speaker button', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-speaker-button'));

			expect(mockMenus.showAudioOutput).toHaveBeenCalledTimes(1);
		});
	});

	describe('the controls', () => {
		it('mutes an open microphone and unmutes a muted one', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-mic-button'));
			expect(conferenceSession.setMicrophone).toHaveBeenLastCalledWith(false);

			mockLiveKit.local.isMicrophoneEnabled = false;
			act(() => useConferenceInteractionStore.getState().setVideoQuality('h360'));
			fireEvent.press(getByTestId('conference-mic-button'));

			expect(conferenceSession.setMicrophone).toHaveBeenLastCalledWith(true);
		});

		it('turns the camera on once the user allows it', async () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-camera-button'));

			await waitFor(() => expect(conferenceSession.setCamera).toHaveBeenCalledWith(true));
		});

		it('leaves the camera off, and says why, when the user refuses', async () => {
			(ensureCameraPermission as jest.Mock).mockResolvedValue(false);
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-camera-button'));

			await waitFor(() => expect(showToast).toHaveBeenCalledWith('Allow camera access to turn your camera on'));
			expect(mockLiveKit.local.localParticipant.setCameraEnabled).not.toHaveBeenCalled();
		});

		it('turns a camera that is already on off without asking for permission again', async () => {
			mockLiveKit.local.isCameraEnabled = true;
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-camera-button'));

			await waitFor(() => expect(conferenceSession.setCamera).toHaveBeenCalledWith(false));
			expect(ensureCameraPermission).not.toHaveBeenCalled();
		});

		it('raises the hand through the session', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-hand-button'));

			expect(conferenceSession.toggleHand).toHaveBeenCalledTimes(1);
		});

		it('offers to lower the hand once it is up', () => {
			useConferenceInteractionStore.getState().applyHandMessage('me', { type: 'hand', raised: true, raisedAt: 10 }, 10);

			const { getByLabelText } = renderCall();

			expect(getByLabelText('Lower hand')).toBeTruthy();
		});

		it('hangs up', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-leave-button'));

			expect(closeConferenceCall).toHaveBeenCalledTimes(1);
		});

		it('opens the menus', () => {
			const { getByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-reaction-button'));
			fireEvent.press(getByTestId('conference-more-button'));
			fireEvent(getByTestId('conference-mic-button'), 'longPress');
			fireEvent(getByTestId('conference-camera-button'), 'longPress');

			expect(mockMenus.showReactions).toHaveBeenCalledTimes(1);
			expect(mockMenus.showMore).toHaveBeenCalledTimes(1);
			expect(mockMenus.showAudioOutput).toHaveBeenCalledTimes(1);
			expect(mockMenus.showCameraOptions).toHaveBeenCalledTimes(1);
		});
	});

	describe('the chat access notice', () => {
		const withoutChat = (membersWithoutAccess: string[]) =>
			infoMock.mockReturnValue(
				callInfo({
					chatAccess: { rid: 'GENERAL', name: 'general', type: 'c', membersWithoutAccess, canInvite: true }
				})
			);

		it('says how many people in the call cannot see the chat, and opens the review', () => {
			withoutChat(['ada']);
			const { getByText, getByTestId } = renderCall();

			expect(getByText("1 in this call can't see the chat")).toBeTruthy();
			fireEvent.press(getByTestId('conference-chat-access-review'));

			expect(mockMenus.showChatAccess).toHaveBeenCalledTimes(1);
		});

		it('goes away for good once dismissed', () => {
			withoutChat(['ada']);
			const { getByTestId, queryByTestId } = renderCall();

			fireEvent.press(getByTestId('conference-chat-access-dismiss'));

			expect(queryByTestId('conference-chat-access-banner')).toBeNull();
		});

		it('is not shown for someone who has left the call', () => {
			withoutChat(['bob']);
			const { queryByTestId } = renderCall();

			expect(queryByTestId('conference-chat-access-banner')).toBeNull();
		});

		it('is not shown to someone who cannot read the chat either', () => {
			withoutChat(['me', 'ada']);
			const { queryByTestId } = renderCall();

			expect(queryByTestId('conference-chat-access-banner')).toBeNull();
		});

		it('is not shown when everyone can see the chat', () => {
			const { queryByTestId } = renderCall();

			expect(queryByTestId('conference-chat-access-banner')).toBeNull();
		});
	});

	describe('the speaking border', () => {
		type TMonitorProps = { identity: string; trackRef?: unknown; onChange: (identity: string, speaking: boolean) => void };
		const monitors = () => mockTileSpeakingMonitor.mock.calls.map(([props]) => props as TMonitorProps);
		const lastMonitorFor = (identity: string) =>
			monitors()
				.filter(props => props.identity === identity)
				.pop() as TMonitorProps;

		it('listens to the voice of everyone whose microphone is on', () => {
			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			expect(lastMonitorFor('me').trackRef).toBe(mockLiveKit.micTracks[0]);
			expect(lastMonitorFor('ada').trackRef).toBe(mockLiveKit.micTracks[1]);
		});

		it('does not listen to someone whose microphone is muted', () => {
			mockLiveKit.micTracks = [openMic(me), { participant: ada, publication: { isMuted: true } }];

			renderCall();

			expect(lastMonitorFor('ada').trackRef).toBeUndefined();
		});

		it('shows the border as soon as the voice is heard, before the server says anything', () => {
			const { getByTestId } = renderCall();
			measureStage(getByTestId);
			expect(within(getByTestId('conference-tile-ada')).queryByTestId('participant-tile-speaking')).toBeNull();

			act(() => lastMonitorFor('ada').onChange('ada', true));

			expect(within(getByTestId('conference-tile-ada')).queryByTestId('participant-tile-speaking')).not.toBeNull();
			expect(within(getByTestId('conference-tile-me')).queryByTestId('participant-tile-speaking')).toBeNull();
		});

		it('takes the border away when the voice stops', () => {
			const { getByTestId } = renderCall();
			measureStage(getByTestId);
			act(() => lastMonitorFor('ada').onChange('ada', true));

			act(() => lastMonitorFor('ada').onChange('ada', false));

			expect(within(getByTestId('conference-tile-ada')).queryByTestId('participant-tile-speaking')).toBeNull();
		});

		it('still shows the border the server asks for, where the voice cannot be heard here', () => {
			mockLiveKit.speakers = [{ identity: 'ada', isLocal: false, audioLevel: 0.5 }];

			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			expect(within(getByTestId('conference-tile-ada')).queryByTestId('participant-tile-speaking')).not.toBeNull();
		});

		it('never shows a border on a muted tile', () => {
			mockLiveKit.micTracks = [openMic(me), { participant: ada, publication: { isMuted: true } }];
			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			act(() => lastMonitorFor('ada').onChange('ada', true));

			expect(within(getByTestId('conference-tile-ada')).queryByTestId('participant-tile-speaking')).toBeNull();
		});

		it('does not listen while the call is minimized', () => {
			act(() => useConferenceCallStore.getState().minimize());

			renderCall();

			expect(mockTileSpeakingMonitor).not.toHaveBeenCalled();
		});

		it('leaves large calls to the server, which would otherwise mean a listener for every tile', () => {
			const crowd = Array.from({ length: 12 }, (_, index) => person(`guest${index}`));
			mockLiveKit.participants = [me, ...crowd];

			renderCall();

			expect(mockTileSpeakingMonitor).not.toHaveBeenCalled();
		});
	});

	describe('speaking while muted', () => {
		it('listens for speech only while the microphone is muted on the call screen', () => {
			mockLiveKit.local.isMicrophoneEnabled = false;

			renderCall();

			expect(speakingWhileMutedMock).toHaveBeenLastCalledWith(true);
		});

		it('does not listen while the microphone is on', () => {
			renderCall();

			expect(speakingWhileMutedMock).toHaveBeenLastCalledWith(false);
		});

		it('does not listen while the call is minimized', () => {
			mockLiveKit.local.isMicrophoneEnabled = false;
			act(() => useConferenceCallStore.getState().minimize());

			renderCall();

			expect(speakingWhileMutedMock).toHaveBeenLastCalledWith(false);
		});

		it('does not listen while the call is still connecting', () => {
			mockLiveKit.local.isMicrophoneEnabled = false;
			useConferenceCallStore.getState().setPhase('connecting');

			renderCall();

			expect(speakingWhileMutedMock).toHaveBeenLastCalledWith(false);
		});

		it('tells the user they are muted when they speak', () => {
			mockLiveKit.local.isMicrophoneEnabled = false;
			speakingWhileMutedMock.mockReturnValue(true);

			const { getByText } = renderCall();

			expect(getByText('You are muted')).toBeTruthy();
		});

		it('says nothing when they are not speaking', () => {
			mockLiveKit.local.isMicrophoneEnabled = false;

			const { queryByTestId } = renderCall();

			expect(queryByTestId('conference-speaking-while-muted')).toBeNull();
		});
	});

	describe('picture in picture', () => {
		it('allows the system window while the call screen is open', () => {
			renderCall();

			expect(pictureInPictureMock).toHaveBeenLastCalledWith(true);
		});

		it('does not allow the system window once the call is minimized', () => {
			act(() => useConferenceCallStore.getState().minimize());

			renderCall();

			expect(pictureInPictureMock).toHaveBeenLastCalledWith(false);
		});

		it('shows only what fits the window, without the controls, while it is showing', () => {
			pictureInPictureMock.mockReturnValue(true);

			const { getByTestId, queryByTestId } = renderCall();

			expect(getByTestId('conference-pip')).toBeTruthy();
			expect(queryByTestId('conference-in-call')).toBeNull();
		});

		it('shows the person we are talking to in the window rather than ourselves', () => {
			pictureInPictureMock.mockReturnValue(true);
			mockLiveKit.cameraTracks = [liveVideo(me)];

			const { getByText, queryByText } = renderCall();

			expect(getByText('Ada')).toBeTruthy();
			expect(queryByText('Me Myself')).toBeNull();
		});

		it('shows the camera of the person on camera in the window', () => {
			pictureInPictureMock.mockReturnValue(true);
			mockLiveKit.cameraTracks = [liveVideo(ada)];

			const { getByText, getByTestId } = renderCall();

			expect(getByText('Ada')).toBeTruthy();
			expect(getByTestId('video-track')).toBeTruthy();
		});

		it('feeds the iOS system window from the camera of the person on camera', () => {
			mockLiveKit.cameraTracks = [liveVideo(ada)];

			const { getByTestId } = renderCall();
			measureStage(getByTestId);

			expect(getByTestId('conference-pip-source')).toBeTruthy();
		});

		it('has no video to feed the iOS system window with when nobody is on camera', () => {
			const { getByTestId, queryByTestId } = renderCall();
			measureStage(getByTestId);

			expect(queryByTestId('conference-pip-source')).toBeNull();
		});
	});

	describe('reactions', () => {
		it('shows who reacted, and clears the reaction once its time is up', () => {
			jest.useFakeTimers().setSystemTime(1_000_000);
			useConferenceInteractionStore.getState().addReaction(createReaction('ada', '🎉', 1_000_000, 'r1'));
			const { getByText, queryByText } = renderCall();
			expect(getByText('🎉')).toBeTruthy();
			expect(getByText('Ada')).toBeTruthy();

			act(() => {
				jest.setSystemTime(1_000_000 + 4_000);
				jest.advanceTimersByTime(1_000);
			});

			expect(queryByText('🎉')).toBeNull();
			jest.useRealTimers();
		});
	});
});
