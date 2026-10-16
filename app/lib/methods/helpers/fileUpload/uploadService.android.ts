import { AppState, DeviceEventEmitter, NativeModules } from 'react-native';

import I18n from '~/i18n';
import { type IUploadTracker } from './definitions';

type TTrackedUpload = { loaded: number; total: number; cancel: () => void };

const tracked = new Set<TTrackedUpload>();
let running = false;
let lastPercent = -1;
let subscriptions: { remove: () => void }[] = [];

const service = () => NativeModules.UploadService;

const percent = () => {
	let loaded = 0;
	let total = 0;
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
	const shouldRun = tracked.size > 0 && AppState.currentState === 'background';
	if (shouldRun && !running) {
		lastPercent = percent();
		Promise.resolve(service()?.start(I18n.t('Uploading'), I18n.t('Cancel'), lastPercent)).catch(() => {
			running = false;
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
	if (!subscriptions.length) {
		subscriptions = [AppState.addEventListener('change', sync), DeviceEventEmitter.addListener('UploadServiceCancel', cancelAll)];
	}
	sync();
	return {
		progress: (loaded, total) => {
			Object.assign(upload, { loaded, total });
			publishProgress();
		},
		end: () => {
			tracked.delete(upload);
			if (!tracked.size) {
				subscriptions.forEach(subscription => subscription.remove());
				subscriptions = [];
			}
			sync();
		}
	};
};
