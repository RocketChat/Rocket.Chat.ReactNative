export const SNAP_SECONDS = 0.5;

export interface IPlaybackClock {
	shown: number;
	target: number;
	rate: number;
	playing: boolean;
	seekGeneration: number;
	seekSettled: boolean;
	awaitingPause: boolean;
}

export interface IPlaybackClockStatus {
	currentTime: number;
	playing: boolean;
	didJustFinish: boolean;
}

export const clamp = (value: number, min: number, max: number) => {
	'worklet';

	return Math.min(Math.max(value, min), max);
};

export const createPlaybackClock = (rate: number): IPlaybackClock => ({
	shown: 0,
	target: 0,
	rate,
	playing: false,
	seekGeneration: 0,
	seekSettled: true,
	awaitingPause: false
});

export const advanceFrame = (clock: IPlaybackClock, elapsedSeconds: number, duration: number): IPlaybackClock => {
	'worklet';

	if (!clock.playing || !clock.seekSettled) {
		return clock;
	}
	const delta = elapsedSeconds * clock.rate;
	const target = Math.min(clock.target + delta, duration);
	const desired = clock.shown + delta;
	const limit = delta / 2;
	const shown = clamp(desired + clamp(target - desired, -limit, limit), 0, duration);
	return { ...clock, target, shown };
};

export const applyStatus = (clock: IPlaybackClock, status: IPlaybackClockStatus): IPlaybackClock => {
	'worklet';

	if (status.didJustFinish) {
		return { ...clock, shown: 0, target: 0, playing: false, awaitingPause: false, seekSettled: true };
	}
	if (clock.awaitingPause && status.playing) {
		return clock;
	}
	const unpaused = { ...clock, awaitingPause: false, playing: status.playing };
	if (!clock.seekSettled) {
		return unpaused;
	}
	const snaps = !status.playing || Math.abs(status.currentTime - clock.shown) > SNAP_SECONDS;
	return { ...unpaused, target: status.currentTime, shown: snaps ? status.currentTime : clock.shown };
};

export const pause = (clock: IPlaybackClock): IPlaybackClock => {
	'worklet';

	return { ...clock, playing: false, target: clock.shown, awaitingPause: true };
};

export const seek = (clock: IPlaybackClock, position: number, generation: number): IPlaybackClock => {
	'worklet';

	return { ...clock, shown: position, target: position, seekGeneration: generation, seekSettled: false };
};

export const settleSeek = (clock: IPlaybackClock, generation: number): IPlaybackClock => {
	'worklet';

	if (generation !== clock.seekGeneration) {
		return clock;
	}
	return { ...clock, seekSettled: true };
};

export const setRate = (clock: IPlaybackClock, rate: number): IPlaybackClock => {
	'worklet';

	return { ...clock, rate };
};
