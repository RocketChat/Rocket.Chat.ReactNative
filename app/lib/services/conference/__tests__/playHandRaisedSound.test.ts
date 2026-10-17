import { createAudioPlayer } from 'expo-audio';

import log from '~/lib/methods/helpers/log';
import { playHandRaisedSound, releaseHandRaisedSound } from '../playHandRaisedSound';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const makePlayer = () => ({
	seekTo: jest.fn(() => Promise.resolve()),
	play: jest.fn(),
	release: jest.fn()
});

describe('playHandRaisedSound', () => {
	let player: ReturnType<typeof makePlayer>;

	beforeEach(() => {
		jest.clearAllMocks();
		player = makePlayer();
		(createAudioPlayer as jest.Mock).mockReturnValue(player);
	});

	afterEach(() => {
		releaseHandRaisedSound();
	});

	it('plays the chime without letting go of the audio session the call is using', () => {
		playHandRaisedSound();

		expect(createAudioPlayer).toHaveBeenCalledWith(expect.anything(), { keepAudioSessionActive: true });
		expect(player.play).toHaveBeenCalledTimes(1);
	});

	it('plays it from the start every time, on the same player', () => {
		playHandRaisedSound();
		playHandRaisedSound();

		expect(createAudioPlayer).toHaveBeenCalledTimes(1);
		expect(player.seekTo).toHaveBeenCalledTimes(2);
		expect(player.seekTo).toHaveBeenCalledWith(0);
		expect(player.play).toHaveBeenCalledTimes(2);
	});

	it('lets go of the player when asked, and makes a new one for the next call', () => {
		playHandRaisedSound();

		releaseHandRaisedSound();
		playHandRaisedSound();

		expect(player.release).toHaveBeenCalledTimes(1);
		expect(createAudioPlayer).toHaveBeenCalledTimes(2);
	});

	it('has nothing to let go of before the first chime', () => {
		expect(() => releaseHandRaisedSound()).not.toThrow();
		expect(player.release).not.toHaveBeenCalled();
	});

	it('logs instead of throwing when the player cannot be made', () => {
		const failure = new Error('no audio');
		(createAudioPlayer as jest.Mock).mockImplementation(() => {
			throw failure;
		});

		expect(() => playHandRaisedSound()).not.toThrow();
		expect(log).toHaveBeenCalledWith(failure);
	});

	it('logs when it cannot rewind to the start', async () => {
		const failure = new Error('seek failed');
		player.seekTo.mockRejectedValue(failure);

		playHandRaisedSound();

		await Promise.resolve();
		expect(log).toHaveBeenCalledWith(failure);
		expect(player.play).toHaveBeenCalledTimes(1);
	});
});
