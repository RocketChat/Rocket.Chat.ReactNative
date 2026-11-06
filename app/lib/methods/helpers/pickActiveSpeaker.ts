export const SPEAKING_THRESHOLD = 0.2;

export const ACTIVE_SPEAKER_SAMPLE_INTERVAL_MS = 80;
export const ACTIVE_SPEAKER_HOLD_MS = 1500;

export type SpeakerLevel = { id: string; level: number };

export type ActiveSpeaker = { id: string | null; heardAt: number };

export const NO_ACTIVE_SPEAKER: ActiveSpeaker = { id: null, heardAt: 0 };

export const loudestSpeakerId = (remoteLevels: SpeakerLevel[]): string | null => {
	let loudest: SpeakerLevel | null = null;
	for (const speaker of remoteLevels) {
		if (speaker.level > SPEAKING_THRESHOLD && (loudest === null || speaker.level > loudest.level)) {
			loudest = speaker;
		}
	}
	return loudest?.id ?? null;
};

export const pickActiveSpeaker = (current: ActiveSpeaker, remoteLevels: SpeakerLevel[], now: number): ActiveSpeaker => {
	const loudestId = loudestSpeakerId(remoteLevels);
	const holdExpired = now - current.heardAt > ACTIVE_SPEAKER_HOLD_MS;

	if (loudestId === null) {
		return current.id !== null && holdExpired ? NO_ACTIVE_SPEAKER : current;
	}
	if (loudestId === current.id) {
		return { id: loudestId, heardAt: now };
	}
	return current.id === null || holdExpired ? { id: loudestId, heardAt: now } : current;
};
