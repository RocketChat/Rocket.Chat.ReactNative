import BackgroundTimer from 'react-native-background-timer';

import { Services } from '../services';

let interval: number | null = null;

export const initVideoConfTimer = (rid: string): void => {
	if (rid) {
		Services.updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
		if (interval) {
			BackgroundTimer.clearInterval(interval);
			BackgroundTimer.stopBackgroundTimer();
			interval = null;
		}
		interval = BackgroundTimer.setInterval(() => {
			Services.updateJitsiTimeout(rid).catch((e: unknown) => console.log(e));
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
