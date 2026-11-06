export const SPEAKING_GAP_TOLERANCE_MS = 800;
export const AUTO_LOWER_AFTER_MS = 3000;

export type SpeakingStreak = { startedAt: number; lastHeardAt: number };

export type AutoLowerSample = { speaking: boolean; now: number };

export type AutoLowerStep = { streak: SpeakingStreak | null; lower: boolean };

const lowersBy = (streak: SpeakingStreak, now: number): boolean => {
	const lowerAt = streak.startedAt + AUTO_LOWER_AFTER_MS;
	const silenceEndsStreakAt = streak.lastHeardAt + SPEAKING_GAP_TOLERANCE_MS;
	return lowerAt <= now && lowerAt <= silenceEndsStreakAt;
};

export const advanceAutoLowerHand = (streak: SpeakingStreak | null, { speaking, now }: AutoLowerSample): AutoLowerStep => {
	if (streak !== null && lowersBy(streak, now)) {
		return { streak: null, lower: true };
	}
	const ongoing = streak !== null && now < streak.lastHeardAt + SPEAKING_GAP_TOLERANCE_MS ? streak : null;
	return { streak: speaking ? { startedAt: ongoing?.startedAt ?? now, lastHeardAt: now } : ongoing, lower: false };
};
