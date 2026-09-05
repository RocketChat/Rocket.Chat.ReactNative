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

	it('loadAudio caches the player keyed by msgId/rid/uri', async () => {
		const { AudioManager, players } = setup();
		const key1 = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		const key2 = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });

		expect(key1).toBe(key2);
		expect(players).toHaveLength(1);
	});

	it('loadAudio returns different keys for different uris', async () => {
		const { AudioManager, players } = setup();
		const key1 = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		const key2 = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://b.mp3' });

		expect(key1).not.toBe(key2);
		expect(players).toHaveLength(2);
	});

	it('unloadRoomAudios releases only players for the given rid', async () => {
		const { AudioManager, players } = setup();
		await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		await AudioManager.loadAudio({ rid: 'room-2', uri: 'file://b.mp3' });
		const [player1, player2] = players;

		await AudioManager.unloadRoomAudios('room-1');

		expect(player1.release).toHaveBeenCalled();
		expect(player2.release).not.toHaveBeenCalled();
	});

	it('unloadRoomAudios matches by exact rid segment, not substring', async () => {
		const { AudioManager, players } = setup();
		await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://room-10/x.mp3' });
		await AudioManager.loadAudio({ rid: 'room-10', uri: 'file://x.mp3' });
		const [playerSubstring, playerExact] = players;

		await AudioManager.unloadRoomAudios('room-1');

		expect(playerSubstring.release).toHaveBeenCalled();
		expect(playerExact.release).not.toHaveBeenCalled();
	});

	it('onEnd releases the player when didJustFinish is true', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		AudioManager.addAudioRendered(key);

		await AudioManager.onEnd(key, { isLoaded: true, didJustFinish: true, currentTime: 5, duration: 5 });

		expect(players[0].release).toHaveBeenCalled();
	});

	it('setPositionAsync seeks the player', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });

		await AudioManager.setPositionAsync(key, 10);

		expect(players[0].seekTo).toHaveBeenCalledWith(10);
	});

	// On iOS setPlaybackRate maps to AVPlayer.rate, and a non-zero rate starts playback
	it('setRateAsync does not touch an idle player, so loading never starts playback', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });

		AudioManager.setRateAsync(key, 1);

		expect(players[0].setPlaybackRate).not.toHaveBeenCalled();
		expect(players[0].play).not.toHaveBeenCalled();
	});

	it('playAudio applies the rate stored while the player was idle', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		AudioManager.setRateAsync(key, 1.5);

		await AudioManager.playAudio(key);

		expect(players[0].setPlaybackRate).toHaveBeenCalledWith(1.5);
		expect(players[0].play).toHaveBeenCalled();
	});

	it('setRateAsync applies immediately to the audio currently playing', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		await AudioManager.playAudio(key);
		players[0].setPlaybackRate.mockClear();

		AudioManager.setRateAsync(key, 2);

		expect(players[0].setPlaybackRate).toHaveBeenCalledWith(2);
	});

	it('setRateAsync leaves other loaded audios untouched while one is playing', async () => {
		const { AudioManager, players } = setup();
		const playingKey = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		const idleKey = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://b.mp3' });
		await AudioManager.playAudio(playingKey);

		AudioManager.setRateAsync(idleKey, 2);

		expect(players[1].setPlaybackRate).not.toHaveBeenCalled();
		expect(players[1].play).not.toHaveBeenCalled();
	});

	it('a recreated player seeks to the saved position before the rate is applied', async () => {
		const { AudioManager, players } = setup();
		const key = await AudioManager.loadAudio({ rid: 'room-1', uri: 'file://a.mp3' });
		AudioManager.setRateAsync(key, 1.5);
		await AudioManager.setPositionAsync(key, 7);
		await AudioManager.onEnd(key, { isLoaded: true, didJustFinish: true, currentTime: 5, duration: 5 });

		await AudioManager.playAudio(key);

		const recreated = players[1];
		const [seekOrder] = recreated.seekTo.mock.invocationCallOrder;
		const [rateOrder] = recreated.setPlaybackRate.mock.invocationCallOrder;
		const [playOrder] = recreated.play.mock.invocationCallOrder;
		expect(seekOrder).toBeLessThan(rateOrder);
		expect(rateOrder).toBeLessThan(playOrder);
	});
});
