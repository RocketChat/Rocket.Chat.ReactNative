import {
	initialSpeechState,
	MUTED_SPEECH_TIMING,
	releaseSpeech,
	SPEAKING_RING_TIMING,
	SPEECH_LEVEL_THRESHOLD,
	SPEECH_MAX_GAP_MS,
	stepSpeech,
	type TSpeechState,
	type TSpeechTiming
} from '../stepSpeech';

const LOUD = SPEECH_LEVEL_THRESHOLD * 4;
const QUIET = SPEECH_LEVEL_THRESHOLD / 4;
const TICK = 50;

const feed = (levels: number[], timing: TSpeechTiming, start = 0, state: TSpeechState = initialSpeechState) =>
	levels.reduce((current, level, index) => stepSpeech(current, level, start + index * TICK, timing), state);

describe('stepSpeech', () => {
	it('is not speaking before anything is heard', () => {
		expect(initialSpeechState.speaking).toBe(false);
	});

	it('does not call a single loud sound speaking, such as a cough or a tap on the phone', () => {
		expect(feed([LOUD], MUTED_SPEECH_TIMING).speaking).toBe(false);
	});

	it('calls it speaking once the voice has lasted as long as the timing asks', () => {
		const samples = Array(MUTED_SPEECH_TIMING.sustainedMs / TICK + 1).fill(LOUD);

		expect(feed(samples, MUTED_SPEECH_TIMING).speaking).toBe(true);
	});

	it('is quicker to call it speaking with the timing of the speaking ring', () => {
		const samples = Array(SPEAKING_RING_TIMING.sustainedMs / TICK + 1).fill(LOUD);

		expect(feed(samples, SPEAKING_RING_TIMING).speaking).toBe(true);
		expect(feed(samples, MUTED_SPEECH_TIMING).speaking).toBe(false);
	});

	it('starts counting again after a quiet moment, so words with pauses are not enough alone', () => {
		const state = feed([LOUD, LOUD, QUIET, LOUD, LOUD], SPEAKING_RING_TIMING);

		expect(state.speaking).toBe(false);
	});

	it('starts counting again after a gap with no readings at all', () => {
		const first = feed([LOUD, LOUD], SPEAKING_RING_TIMING);

		const state = stepSpeech(first, LOUD, TICK + SPEECH_MAX_GAP_MS + 1, SPEAKING_RING_TIMING);

		expect(state.speaking).toBe(false);
		expect(state.loudSince).toBe(TICK + SPEECH_MAX_GAP_MS + 1);
	});

	it('keeps saying speaking through a pause between words', () => {
		const speaking = feed(Array(6).fill(LOUD), SPEAKING_RING_TIMING);

		const state = stepSpeech(speaking, QUIET, 400, SPEAKING_RING_TIMING);

		expect(state.speaking).toBe(true);
	});

	it('counts a level exactly at the threshold as quiet', () => {
		expect(feed(Array(10).fill(SPEECH_LEVEL_THRESHOLD), SPEAKING_RING_TIMING).speaking).toBe(false);
	});
});

describe('releaseSpeech', () => {
	const speaking = feed(Array(6).fill(LOUD), SPEAKING_RING_TIMING);
	const lastLoudAt = 5 * TICK;

	it('keeps saying speaking until they have been quiet for as long as the timing asks', () => {
		expect(releaseSpeech(speaking, lastLoudAt + SPEAKING_RING_TIMING.releaseMs - 1, SPEAKING_RING_TIMING).speaking).toBe(true);
	});

	it('stops saying speaking once they have been quiet long enough', () => {
		expect(releaseSpeech(speaking, lastLoudAt + SPEAKING_RING_TIMING.releaseMs, SPEAKING_RING_TIMING)).toEqual(
			initialSpeechState
		);
	});

	it('holds on longer with the timing of the muted notice than with the speaking ring', () => {
		const at = lastLoudAt + SPEAKING_RING_TIMING.releaseMs;

		expect(releaseSpeech(speaking, at, MUTED_SPEECH_TIMING).speaking).toBe(true);
	});

	it('leaves a state that is not speaking alone', () => {
		const state = feed([LOUD], SPEAKING_RING_TIMING);

		expect(releaseSpeech(state, 60_000, SPEAKING_RING_TIMING)).toBe(state);
	});
});
