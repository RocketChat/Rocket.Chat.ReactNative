import { playCallEndedSound, resetPlayCallEndedSoundForTesting } from './playCallEndedSound';

const mockLog = jest.fn();
jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: (...args: unknown[]) => mockLog(...args)
}));

// Access the global mock from jest.setup.js - it provides a consistent mock player
// eslint-disable-next-line @typescript-eslint/no-var-requires
const expoAudio = require('expo-audio');

const mockCreateAudioPlayer = expoAudio.createAudioPlayer as jest.Mock;
const mockPlayer = expoAudio.createAudioPlayer();

beforeEach(() => {
	jest.clearAllMocks();
	resetPlayCallEndedSoundForTesting();
	mockLog.mockClear();
	mockCreateAudioPlayer.mockClear();
});

describe('playCallEndedSound', () => {
	it('creates a player and starts playback when invoked', () => {
		playCallEndedSound();

		expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
		expect(mockPlayer.play).toHaveBeenCalledTimes(1);
	});

	it('registers a playback status listener', () => {
		playCallEndedSound();

		expect(mockPlayer.addListener).toHaveBeenCalledWith('playbackStatusUpdate', expect.any(Function));
	});

	it('removes the player when didJustFinish fires', () => {
		playCallEndedSound();

		// Use the player that was actually created in this test
		const actualPlayer = mockCreateAudioPlayer.mock.results[0].value;
		const statusCallback = actualPlayer.addListener.mock.calls.find(
			([event]: [string, unknown]) => event === 'playbackStatusUpdate'
		)?.[1];
		expect(statusCallback).toBeDefined();

		statusCallback({ isLoaded: true, didJustFinish: true });

		expect(actualPlayer.release).toHaveBeenCalledTimes(1);
	});

	it('does not remove when didJustFinish is false', () => {
		playCallEndedSound();

		const addListenerCalls = mockPlayer.addListener.mock.calls;
		const statusCallback = addListenerCalls.find(([event]: [string, unknown]) => event === 'playbackStatusUpdate')?.[1];
		statusCallback?.({ isLoaded: true, didJustFinish: false });

		expect(mockPlayer.release).not.toHaveBeenCalled();
	});

	it('double-invocation while first is in flight does not produce overlapping playback', () => {
		// Start first invocation
		playCallEndedSound();

		// Second invocation while first is still loading — must be a no-op
		playCallEndedSound();

		// createAudioPlayer and play must each have been called exactly once (coalescing)
		expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
		expect(mockPlayer.play).toHaveBeenCalledTimes(1);
	});

	it('allows a new invocation after the previous cue completes', () => {
		playCallEndedSound();

		// Simulate completion
		const addListenerCalls = mockPlayer.addListener.mock.calls;
		const statusCallback = addListenerCalls.find(([event]: [string, unknown]) => event === 'playbackStatusUpdate')?.[1];
		statusCallback?.({ isLoaded: true, didJustFinish: true });

		// Reset mocks to count fresh calls
		mockCreateAudioPlayer.mockClear();
		mockPlayer.play.mockClear();
		mockPlayer.addListener.mockClear();

		playCallEndedSound();

		expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
		expect(mockPlayer.play).toHaveBeenCalledTimes(1);
	});

	it('watchdog releases the lock if didJustFinish never fires', () => {
		jest.useFakeTimers();
		try {
			playCallEndedSound();
			// didJustFinish never fires; lock would be permanent without the watchdog.
			expect(mockPlayer.release).not.toHaveBeenCalled();

			jest.advanceTimersByTime(5000);

			// Watchdog forces remove + lock release.
			expect(mockPlayer.release).toHaveBeenCalledTimes(1);

			// Subsequent invocation is allowed (lock cleared).
			mockCreateAudioPlayer.mockClear();
			mockPlayer.play.mockClear();
			playCallEndedSound();
			expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
			expect(mockPlayer.play).toHaveBeenCalledTimes(1);
		} finally {
			jest.useRealTimers();
		}
	});

	it('didJustFinish clears the watchdog so it does not double-remove', () => {
		jest.useFakeTimers();
		try {
			playCallEndedSound();

			const addListenerCalls = mockPlayer.addListener.mock.calls;
			const statusCallback = addListenerCalls.find(([event]: [string, unknown]) => event === 'playbackStatusUpdate')?.[1];
			statusCallback?.({ isLoaded: true, didJustFinish: true });
			expect(mockPlayer.release).toHaveBeenCalledTimes(1);

			// Watchdog must not fire after natural completion.
			jest.advanceTimersByTime(10000);
			expect(mockPlayer.release).toHaveBeenCalledTimes(1);
		} finally {
			jest.useRealTimers();
		}
	});

	it('calls log when createAudioPlayer throws', () => {
		const err = new Error('E_LOAD_FAILED');
		mockCreateAudioPlayer.mockImplementationOnce(() => {
			throw err;
		});

		playCallEndedSound();

		expect(mockLog).toHaveBeenCalledWith(err);
	});
});
