import { updateJitsiTimeout } from '../services/restApi';

let interval: ReturnType<typeof setInterval> | null = null;

export const initVideoConfTimer = (rid: string): void => {
	if (rid) {
		updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		interval = setInterval(() => {
			updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
		}, 10000);
	}
};

export const endVideoConfTimer = (): void => {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
};
