import BackgroundTimer from 'react-native-background-timer';

import { updateJitsiTimeout } from '../services/restApi';

let interval: number | null = null;

export const initVideoConfTimer = (rid: string): void => {
	if (rid) {
		updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
		if (interval) {
			BackgroundTimer.clearInterval(interval);
			BackgroundTimer.stopBackgroundTimer();
			interval = null;
		}
		interval = BackgroundTimer.setInterval(() => {
			updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
		}, 10000);
	}
};

export const endVideoConfTimer = (): void => {
	if (interval) {
		BackgroundTimer.clearInterval(interval);
		interval = null;
		BackgroundTimer.stopBackgroundTimer();
	}
};
