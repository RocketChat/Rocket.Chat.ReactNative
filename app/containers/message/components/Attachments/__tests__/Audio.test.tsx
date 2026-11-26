import { render } from '@testing-library/react-native';

import MessageAudio from '../Audio';

const REMOTE_URL = 'https://open.rocket.chat/file-upload/audio.m4a?rc_token=token&rc_uid=user';
const LOCAL_FILE = 'file:///documents/open.rocket.chat/msg/audio.m4a';

const mockDownload = jest.fn();
const mockAudioPlayer = jest.fn((_props: { fileUri: string }) => null);

jest.mock('~/containers/message/hooks/useMediaAutoDownload', () => ({
	useMediaAutoDownload: () => mockDownload()
}));
jest.mock('~/containers/AudioPlayer', () => (props: { fileUri: string }) => mockAudioPlayer(props));
jest.mock('~/containers/markdown', () => () => null);
jest.mock('~/containers/message/stores/MessageRoomStore', () => ({
	useMessageUser: () => ({ username: 'user' }),
	useRid: () => 'rid'
}));
jest.mock('~/containers/message/stores/MessageStore', () => ({ useMessageId: () => 'msg' }));

const shownFileUri = () => mockAudioPlayer.mock.lastCall?.[0].fileUri;

describe('MessageAudio', () => {
	beforeEach(() => mockAudioPlayer.mockClear());

	it('plays the file saved on the device once it is downloaded', () => {
		mockDownload.mockReturnValue({
			status: 'downloaded',
			onPress: jest.fn(),
			url: REMOTE_URL,
			currentFile: { title_link: LOCAL_FILE }
		});
		render(<MessageAudio file={{ audio_url: '/audio.m4a' }} />);

		expect(shownFileUri()).toBe(LOCAL_FILE);
	});

	it('keeps the workspace url while the file is not on the device', () => {
		mockDownload.mockReturnValue({
			status: 'to-download',
			onPress: jest.fn(),
			url: REMOTE_URL,
			currentFile: { title_link: '/file-upload/audio.m4a' }
		});
		render(<MessageAudio file={{ audio_url: '/audio.m4a' }} />);

		expect(shownFileUri()).toBe(REMOTE_URL);
	});
});
