import { act, fireEvent, render, screen } from '@testing-library/react-native';

import NowPlayingAudio from '..';
import AudioManager from '~/lib/methods/AudioManager';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { useNowPlayingAudioStore, type INowPlayingAudio } from '~/lib/methods/useNowPlayingAudioStore';
import { getMessageById } from '~/lib/database/services/Message';
import { type TMessageModel } from '~/definitions/IMessage';
import { useCallStore } from '~/lib/services/voip/useCallStore';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';

jest.mock('~/lib/methods/AudioManager', () => ({ playAudio: jest.fn(), pauseAudio: jest.fn(), closeAudio: jest.fn() }));
jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/store/auxStore', () => ({ store: { getState: () => ({ settings: { UI_Use_Real_Name: true } }) } }));
jest.mock('~/lib/methods/helpers/getRoomTitle', () => ({ getRoomTitle: (room: { fname: string }) => room.fname }));
jest.mock('~/lib/database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve({ u: { username: 'jane.doe', name: 'Jane Doe' } }))
}));
jest.mock('~/lib/database/services/ThreadMessage', () => ({ getThreadMessageById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('~/lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve({ fname: 'General' }))
}));

const playingAudio: INowPlayingAudio = {
	audioKey: 'msg-1-room-1-file://a.mp3',
	rid: 'room-1',
	msgId: 'msg-1',
	playing: true,
	currentTime: 12,
	duration: 90
};

const renderWithAudio = async (audio: INowPlayingAudio | null) => {
	useNowPlayingAudioStore.setState({ audio });
	render(<NowPlayingAudio />);
	await act(() => Promise.resolve());
};

describe('NowPlayingAudio', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders nothing while no audio is playing', async () => {
		await renderWithAudio(null);

		expect(screen.queryByTestId('now-playing-audio')).toBeNull();
	});

	it('shows the sender, the room, the elapsed time and the duration', async () => {
		await renderWithAudio(playingAudio);

		expect(screen.getByText('Jane Doe')).toBeOnTheScreen();
		expect(screen.getByText('General')).toBeOnTheScreen();
		expect(screen.getByText('· 00:12 / 01:30')).toBeOnTheScreen();
	});

	it('shows the sender username when the sender has no name', async () => {
		jest.mocked(getMessageById).mockResolvedValueOnce({ u: { _id: 'u1', username: 'jane.doe' } } as TMessageModel);

		await renderWithAudio(playingAudio);

		expect(screen.getByText('jane.doe')).toBeOnTheScreen();
	});

	it('shows the details of the next audio once it replaces the previous one', async () => {
		await renderWithAudio(playingAudio);
		jest.mocked(getMessageById).mockResolvedValueOnce({ u: { _id: 'u2', username: 'john', name: 'John Roe' } } as TMessageModel);

		await act(async () => {
			useNowPlayingAudioStore.setState({ audio: { ...playingAudio, audioKey: 'msg-2-room-1-file://b.mp3', msgId: 'msg-2' } });
		});

		expect(screen.getByText('John Roe')).toBeOnTheScreen();
		expect(screen.queryByText('Jane Doe')).toBeNull();
	});

	it('shows the room as the title of an audio with no message, like a file in the Files list', async () => {
		await renderWithAudio({ ...playingAudio, audioKey: 'undefined-room-1-file://upload.mp3', msgId: undefined });

		expect(screen.getByText('General')).toBeOnTheScreen();
		expect(screen.getByText('00:12 / 01:30')).toBeOnTheScreen();
		expect(getMessageById).not.toHaveBeenCalled();
	});

	it('opens the room of an audio with no message without jumping to a message', async () => {
		await renderWithAudio({ ...playingAudio, msgId: undefined });

		fireEvent.press(screen.getByTestId('now-playing-audio-open-room'));

		expect(goRoom).toHaveBeenCalledWith({ item: { rid: 'room-1' }, isMasterDetail: false, jumpToMessageId: undefined });
	});

	it('hides during a voice call', async () => {
		useCallStore.setState({ call: {} as ReturnType<typeof useCallStore.getState>['call'] });

		await renderWithAudio(playingAudio);

		expect(screen.queryByTestId('now-playing-audio')).toBeNull();
		act(() => useCallStore.setState({ call: null }));
		expect(screen.getByTestId('now-playing-audio')).toBeOnTheScreen();
	});

	it('hides during a conference call', async () => {
		useConferenceCallStore.setState({ callId: 'call-1' });

		await renderWithAudio(playingAudio);

		expect(screen.queryByTestId('now-playing-audio')).toBeNull();
		act(() => useConferenceCallStore.setState({ callId: undefined }));
		expect(screen.getByTestId('now-playing-audio')).toBeOnTheScreen();
	});

	it('pauses a playing audio and plays a paused one', async () => {
		await renderWithAudio(playingAudio);
		fireEvent.press(screen.getByTestId('now-playing-audio-play-pause'));
		expect(AudioManager.pauseAudio).toHaveBeenCalled();

		act(() => useNowPlayingAudioStore.setState({ audio: { ...playingAudio, playing: false } }));
		fireEvent.press(screen.getByTestId('now-playing-audio-play-pause'));
		expect(AudioManager.playAudio).toHaveBeenCalledWith(playingAudio.audioKey);
	});

	it('closes the audio', async () => {
		await renderWithAudio(playingAudio);

		fireEvent.press(screen.getByTestId('now-playing-audio-close'));

		expect(AudioManager.closeAudio).toHaveBeenCalled();
	});

	it('opens the room the audio came from at its message', async () => {
		await renderWithAudio(playingAudio);

		fireEvent.press(screen.getByTestId('now-playing-audio-open-room'));

		expect(goRoom).toHaveBeenCalledWith({ item: { rid: 'room-1' }, isMasterDetail: false, jumpToMessageId: 'msg-1' });
	});

	it('labels its controls for screen readers', async () => {
		await renderWithAudio(playingAudio);

		expect(screen.getByLabelText('Pause')).toBeOnTheScreen();
		expect(screen.getByLabelText('Close audio player')).toBeOnTheScreen();
		expect(screen.getByLabelText('Audio message from Jane Doe, General, 00:12 / 01:30')).toBeOnTheScreen();
	});
});
