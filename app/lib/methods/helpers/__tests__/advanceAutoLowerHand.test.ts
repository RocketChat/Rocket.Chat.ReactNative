import type { SpeakingStreak } from '../advanceAutoLowerHand';
import { advanceAutoLowerHand } from '../advanceAutoLowerHand';

const SAMPLE_EVERY_MS = 100;
const LOUD = true;
const QUIET = false;

const loweredAt = (speakingAt: (time: number) => boolean, until = 10000): number | null => {
	let streak: SpeakingStreak | null = null;
	for (let now = 0; now <= until; now += SAMPLE_EVERY_MS) {
		const step = advanceAutoLowerHand(streak, { speaking: speakingAt(now), now });
		if (step.lower) return now;
		streak = step.streak;
	}
	return null;
};

describe('advanceAutoLowerHand', () => {
	it('lowers the hand of someone who keeps speaking for three seconds', () => {
		expect(loweredAt(() => LOUD)).toBe(3000);
	});

	it('counts from the moment they started speaking, not from when sampling started', () => {
		expect(loweredAt(time => (time < 1000 ? QUIET : LOUD))).toBe(4000);
	});

	it('keeps counting through pauses shorter than 800ms', () => {
		expect(loweredAt(time => (time % 700 < SAMPLE_EVERY_MS ? LOUD : QUIET))).toBe(3000);
	});

	it('starts the wait over after a pause of 800ms', () => {
		expect(loweredAt(time => (time > 2000 && time < 2900 ? QUIET : LOUD))).toBe(5900);
	});

	it('never lowers the hand once a steady silence has outlasted a pause between words', () => {
		expect(loweredAt(time => (time === 0 ? LOUD : QUIET))).toBeNull();
	});

	it('lowers the hand when the three seconds end at the very moment the pause would have ended the streak', () => {
		const streak = { startedAt: 0, lastHeardAt: 2200 };
		expect(advanceAutoLowerHand(streak, { speaking: QUIET, now: 3000 })).toEqual({ streak: null, lower: true });
	});

	it('starts a new streak instead of lowering the hand when the pause ended the streak first', () => {
		const streak = { startedAt: 0, lastHeardAt: 2100 };
		expect(advanceAutoLowerHand(streak, { speaking: LOUD, now: 3000 })).toEqual({
			streak: { startedAt: 3000, lastHeardAt: 3000 },
			lower: false
		});
	});

	it('forgets the streak once it has lowered the hand', () => {
		const streak = { startedAt: 0, lastHeardAt: 2900 };
		expect(advanceAutoLowerHand(streak, { speaking: LOUD, now: 3000 })).toEqual({ streak: null, lower: true });
	});

	it('keeps the streak it is given while the wait is not over', () => {
		const streak = { startedAt: 0, lastHeardAt: 500 };
		expect(advanceAutoLowerHand(streak, { speaking: QUIET, now: 600 })).toEqual({ streak, lower: false });
	});
});
