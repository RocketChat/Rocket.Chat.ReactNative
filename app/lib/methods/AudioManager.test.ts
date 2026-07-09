jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('./getFilePathAudio', () => ({
	getFilePathAudio: jest.fn(() => 'file://x')
}));

const setup = () => {
	jest.resetModules();
	const players: any[] = [];
	const createAudioPlayer = require('expo-audio').createAudioPlayer as jest.Mock;
	createAudioPlayer.mockImplementation(() => {
		const player = {
			play: jest.fn(),
			pause: jest.fn(),
			stop: jest.fn(),
			replay: jest.fn(),
			setPlaying: jest.fn(),
			setLooping: jest.fn(),
			setMuted: jest.fn(),
			setVolume: jest.fn(),
			setPlaybackRate: jest.fn(),
			seekTo: jest.fn(),
			release: jest.fn(),
			remove: jest.fn(),
			addListener: jest.fn(() => ({ remove: jest.fn() })),
			removeListener: jest.fn(),
			getStatusAsync: jest.fn(() => Promise.resolve()),
			playing: false,
			looping: false,
			muted: false,
			volume: 1,
			playbackRate: 1,
			currentTime: 0,
			duration: 0,
			loaded: false,
			progress: 0,
			buffering: false,
			keepAlive: false
		};
		players.push(player);
		return player;
	});
	const AudioManager = require('./AudioManager').default;
	return { AudioManager, players };
};

describe('AudioManager', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('loadAudio caches the player keyed by msgId/rid/uri', () => {
		const { AudioManager, players } = setup();
		const key1 = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		const key2 = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });

		expect(key1).toBe(key2);
		expect(players).toHaveLength(1);
	});

	it('loadAudio returns different keys for different uris', () => {
		const { AudioManager, players } = setup();
		const key1 = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		const key2 = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://b.mp3' });

		expect(key1).not.toBe(key2);
		expect(players).toHaveLength(2);
	});

	it('unloadRoomAudios releases only players for the given rid', async () => {
		const { AudioManager, players } = setup();
		AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		AudioManager.loadAudio({ rid: 'room-2', uri: 'file://b.mp3' });
		const [player1, player2] = players;

		await AudioManager.unloadRoomAudios('room-1');

		expect(player1.release).toHaveBeenCalled();
		expect(player2.release).not.toHaveBeenCalled();
	});

	it('unloadRoomAudios matches by exact rid segment, not substring', async () => {
		const { AudioManager, players } = setup();
		AudioManager.loadAudio({ rid: 'room-1', uri: 'file://room-10/x.mp3' });
		AudioManager.loadAudio({ rid: 'room-10', uri: 'file://x.mp3' });
		const [playerSubstring, playerExact] = players;

		await AudioManager.unloadRoomAudios('room-1');

		expect(playerSubstring.release).toHaveBeenCalled();
		expect(playerExact.release).not.toHaveBeenCalled();
	});

	it('onEnd releases the player when didJustFinish is true', async () => {
		const { AudioManager, players } = setup();
		const key = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		AudioManager.addAudioRendered(key);

		await AudioManager.onEnd(key, { isLoaded: true, didJustFinish: true, currentTime: 5, duration: 5 });

		expect(players[0].release).toHaveBeenCalled();
	});

	it('setPositionAsync seeks the player', async () => {
		const { AudioManager, players } = setup();
		const key = AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });

		await AudioManager.setPositionAsync(key, 10);

		expect(players[0].seekTo).toHaveBeenCalledWith(10);
	});
});
