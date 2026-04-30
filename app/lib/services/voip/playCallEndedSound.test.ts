import { playCallEndedSound, resetPlayCallEndedSoundForTesting } from './playCallEndedSound';

// Mock expo-av at the test boundary, matching the style used in the VoIP services directory.
const mockLoadAsync = jest.fn(() => Promise.resolve());
const mockPlayAsync = jest.fn(() => Promise.resolve());
const mockUnloadAsync = jest.fn(() => Promise.resolve());
type MockPlaybackStatus = { isLoaded: boolean; didJustFinish?: boolean };
let capturedPlaybackStatusUpdate: ((status: MockPlaybackStatus) => void) | null = null;

const mockSetOnPlaybackStatusUpdate = jest.fn((cb: (status: MockPlaybackStatus) => void) => {
	capturedPlaybackStatusUpdate = cb;
});

const mockSoundInstance = {
	loadAsync: mockLoadAsync,
	playAsync: mockPlayAsync,
	unloadAsync: mockUnloadAsync,
	setOnPlaybackStatusUpdate: mockSetOnPlaybackStatusUpdate
};

jest.mock('expo-av', () => ({
	Audio: {
		Sound: jest.fn(() => mockSoundInstance)
	}
}));

beforeEach(() => {
	jest.clearAllMocks();
	capturedPlaybackStatusUpdate = null;
	resetPlayCallEndedSoundForTesting();
});

describe('playCallEndedSound', () => {
	it('triggers playback when invoked', async () => {
		await playCallEndedSound();

		expect(mockLoadAsync).toHaveBeenCalledTimes(1);
		expect(mockPlayAsync).toHaveBeenCalledTimes(1);
	});

	it('registers a playback status callback', async () => {
		await playCallEndedSound();

		expect(mockSetOnPlaybackStatusUpdate).toHaveBeenCalledTimes(1);
	});

	it('unloads the player when didJustFinish fires', async () => {
		await playCallEndedSound();

		expect(capturedPlaybackStatusUpdate).not.toBeNull();
		capturedPlaybackStatusUpdate!({ isLoaded: true, didJustFinish: true });

		expect(mockUnloadAsync).toHaveBeenCalledTimes(1);
	});

	it('does not unload when didJustFinish is false', async () => {
		await playCallEndedSound();

		capturedPlaybackStatusUpdate!({ isLoaded: true, didJustFinish: false });

		expect(mockUnloadAsync).not.toHaveBeenCalled();
	});

	it('double-invocation while first is in flight does not produce overlapping playback', async () => {
		// First invocation — loadAsync resolves immediately in mock but we can test
		// the coalescing: a second call while the first play is underway must not call
		// loadAsync/playAsync a second time.
		let resolveLoad!: () => void;
		mockLoadAsync.mockImplementationOnce(
			() =>
				new Promise<void>(res => {
					resolveLoad = res;
				})
		);

		// Start first invocation (hangs at loadAsync)
		const first = playCallEndedSound();

		// Second invocation while first is still loading — must be a no-op
		const second = playCallEndedSound();

		// Resolve the first load
		resolveLoad();
		await first;
		await second;

		// loadAsync and playAsync must each have been called exactly once
		expect(mockLoadAsync).toHaveBeenCalledTimes(1);
		expect(mockPlayAsync).toHaveBeenCalledTimes(1);
	});

	it('allows a new invocation after the previous cue completes', async () => {
		await playCallEndedSound();
		// Simulate completion
		capturedPlaybackStatusUpdate!({ isLoaded: true, didJustFinish: true });

		// Reset mocks to count fresh calls
		mockLoadAsync.mockClear();
		mockPlayAsync.mockClear();
		mockSetOnPlaybackStatusUpdate.mockClear();
		capturedPlaybackStatusUpdate = null;

		await playCallEndedSound();

		expect(mockLoadAsync).toHaveBeenCalledTimes(1);
		expect(mockPlayAsync).toHaveBeenCalledTimes(1);
	});
});
