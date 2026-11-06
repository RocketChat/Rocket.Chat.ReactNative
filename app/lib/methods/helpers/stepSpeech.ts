export const SPEECH_LEVEL_THRESHOLD = 0.02;
export const SPEECH_MAX_GAP_MS = 250;

export type TSpeechTiming = { sustainedMs: number; releaseMs: number };

export const MUTED_SPEECH_TIMING: TSpeechTiming = { sustainedMs: 400, releaseMs: 3000 };
export const SPEAKING_RING_TIMING: TSpeechTiming = { sustainedMs: 100, releaseMs: 1000 };

export type TSpeechState = {
	loudSince: number | undefined;
	lastLoudAt: number | undefined;
	speaking: boolean;
};

export const initialSpeechState: TSpeechState = {
	loudSince: undefined,
	lastLoudAt: undefined,
	speaking: false
};

export const stepSpeech = (state: TSpeechState, level: number, now: number, { sustainedMs }: TSpeechTiming): TSpeechState => {
	if (level <= SPEECH_LEVEL_THRESHOLD) {
		return { ...state, loudSince: undefined };
	}
	const continuing = state.lastLoudAt !== undefined && now - state.lastLoudAt <= SPEECH_MAX_GAP_MS;
	const loudSince = continuing ? (state.loudSince ?? now) : now;
	return { loudSince, lastLoudAt: now, speaking: state.speaking || now - loudSince >= sustainedMs };
};

export const releaseSpeech = (state: TSpeechState, now: number, { releaseMs }: TSpeechTiming): TSpeechState =>
	state.speaking && state.lastLoudAt !== undefined && now - state.lastLoudAt >= releaseMs ? initialSpeechState : state;
