import {
	advanceFrame,
	applyStatus,
	createPlaybackClock,
	type IPlaybackClock,
	pause,
	seek,
	settleSeek,
	setRate,
	SNAP_SECONDS
} from '../playbackClock';

const FRAME_SECONDS = 1 / 60;
const DURATION = 60;

const playing = (currentTime: number) => ({ currentTime, playing: true, didJustFinish: false });
const paused = (currentTime: number) => ({ currentTime, playing: false, didJustFinish: false });

const runFrames = (clock: IPlaybackClock, frames: number) =>
	Array.from({ length: frames }).reduce<IPlaybackClock>(current => advanceFrame(current, FRAME_SECONDS, DURATION), clock);

const playingAt = (currentTime: number, rate = 1) => applyStatus(createPlaybackClock(rate), playing(currentTime));

describe('playbackClock', () => {
	it('moves the progress every frame at the playback rate', () => {
		const clock = playingAt(10, 2);
		const next = advanceFrame(clock, FRAME_SECONDS, DURATION);
		expect(next.shown).toBeCloseTo(10 + 2 * FRAME_SECONDS);
	});

	it('does no work per frame while paused', () => {
		const clock = applyStatus(createPlaybackClock(1), paused(10));
		expect(advanceFrame(clock, FRAME_SECONDS, DURATION)).toBe(clock);
	});

	it('eases into a small correction instead of jumping', () => {
		const clock = runFrames(playingAt(10), 6);
		const corrected = applyStatus(clock, playing(clock.shown - 0.2));
		expect(corrected.shown).toBe(clock.shown);

		const next = advanceFrame(corrected, FRAME_SECONDS, DURATION);
		const step = next.shown - corrected.shown;
		expect(step).toBeGreaterThanOrEqual(FRAME_SECONDS / 2);
		expect(step).toBeLessThanOrEqual(FRAME_SECONDS * 1.5);

		const settled = runFrames(next, 60);
		expect(settled.shown).toBeCloseTo(settled.target);
	});

	it('jumps to a reported position farther than the snap distance', () => {
		const clock = playingAt(10);
		expect(applyStatus(clock, playing(10 + SNAP_SECONDS * 2)).shown).toBe(10 + SNAP_SECONDS * 2);
	});

	it('stops at once on pause and ignores playing statuses sent before the pause', () => {
		const clock = pause(runFrames(playingAt(10), 3));
		const frozen = clock.shown;
		expect(runFrames(clock, 3).shown).toBe(frozen);

		const stale = applyStatus(clock, playing(10.1));
		expect(stale.playing).toBe(false);
		expect(stale.shown).toBe(frozen);

		const confirmed = applyStatus(stale, paused(10.06));
		expect(confirmed.shown).toBe(10.06);
		expect(confirmed.awaitingPause).toBe(false);
		expect(applyStatus(confirmed, playing(10.06)).playing).toBe(true);
	});

	it('holds at the seek position until the player confirms the seek', () => {
		const clock = seek(playingAt(10), 40, 1);
		expect(runFrames(clock, 3).shown).toBe(40);

		const stale = applyStatus(clock, playing(10.2));
		expect(stale.shown).toBe(40);
		expect(stale.playing).toBe(true);

		const settled = settleSeek(stale, 1);
		expect(runFrames(settled, 1).shown).toBeGreaterThan(40);
		expect(applyStatus(settled, playing(40.05)).target).toBe(40.05);
	});

	it('ignores the confirmation of an older seek', () => {
		const clock = seek(seek(playingAt(10), 40, 1), 20, 2);
		expect(settleSeek(clock, 1).seekSettled).toBe(false);
		expect(settleSeek(clock, 2).seekSettled).toBe(true);
	});

	it('takes a status that arrives while a seek is pending only for play or pause', () => {
		const clock = seek(applyStatus(createPlaybackClock(1), paused(10)), 30, 1);
		const started = applyStatus(clock, playing(10));
		expect(started.playing).toBe(true);
		expect(started.shown).toBe(30);
	});

	it('resets to the start when the audio ends', () => {
		const clock = applyStatus(seek(playingAt(50), 55, 1), { currentTime: 60, playing: false, didJustFinish: true });
		expect(clock).toMatchObject({ shown: 0, target: 0, playing: false, seekSettled: true });
	});

	it('follows a speed change from the next frame', () => {
		const clock = setRate(playingAt(10), 2);
		expect(advanceFrame(clock, FRAME_SECONDS, DURATION).shown).toBeCloseTo(10 + 2 * FRAME_SECONDS);
	});

	it('never passes the duration', () => {
		expect(runFrames(playingAt(DURATION - 0.01), 10).shown).toBe(DURATION);
	});
});
