import { DeviceEventEmitter, NativeModules } from 'react-native';

import I18n from '~/i18n';
import { type IUploadTracker } from './definitions';

type TTrackedUpload = { loaded: number; total: number; cancel: () => void };

const tracked = new Set<TTrackedUpload>();
const finished = { loaded: 0, total: 0 };
let running = false;
let startAttempt = 0;
let lastPercent = -1;
let cancelSubscription: { remove: () => void } | undefined;

const service = () => NativeModules.UploadService;

const percent = () => {
	let { loaded, total } = finished;
	tracked.forEach(upload => {
		loaded += upload.loaded;
		total += upload.total;
	});
	return total ? Math.floor((loaded / total) * 100) : 0;
};

const publishProgress = () => {
	if (!running) {
		return;
	}
	const next = percent();
	if (next !== lastPercent) {
		lastPercent = next;
		service()?.updateProgress(next);
	}
};

const sync = () => {
	const shouldRun = tracked.size > 0;
	if (shouldRun && !running) {
		lastPercent = percent();
		startAttempt += 1;
		const attempt = startAttempt;
		Promise.resolve(service()?.start(I18n.t('Uploading'), I18n.t('Cancel'), lastPercent)).catch(() => {
			if (attempt === startAttempt) {
				running = false;
			}
		});
	} else if (!shouldRun && running) {
		service()?.stop();
	}
	running = shouldRun;
	publishProgress();
};

const cancelAll = () => {
	tracked.forEach(({ cancel }) => cancel());
};

export const trackUpload = (cancel: () => void): IUploadTracker => {
	const upload = { loaded: 0, total: 0, cancel };
	tracked.add(upload);
	if (!cancelSubscription) {
		cancelSubscription = DeviceEventEmitter.addListener('UploadServiceCancel', cancelAll);
	}
	sync();
	return {
		progress: (loaded, total) => {
			Object.assign(upload, { loaded, total });
			sync();
		},
		end: () => {
			tracked.delete(upload);
			finished.loaded += upload.total;
			finished.total += upload.total;
			if (!tracked.size) {
				Object.assign(finished, { loaded: 0, total: 0 });
				cancelSubscription?.remove();
				cancelSubscription = undefined;
			}
			sync();
		}
	};
};
