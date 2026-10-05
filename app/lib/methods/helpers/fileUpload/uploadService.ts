import { AppState, DeviceEventEmitter, NativeModules } from 'react-native';

import I18n from '~/i18n';
import { cancelAllUploads } from '~/lib/methods/sendFileMessage/utils';

const uploads = new Map<number, { loaded: number; total: number; cancel: () => void }>();
let nextId = 0;
let running = false;
let lastPercent = -1;
let subscriptions: { remove: () => void }[] = [];

const service = () => NativeModules.UploadService;

const percent = () => {
	const { loaded, total } = [...uploads.values()].reduce(
		(sum, upload) => ({ loaded: sum.loaded + upload.loaded, total: sum.total + upload.total }),
		{ loaded: 0, total: 0 }
	);
	return total ? Math.floor((loaded / total) * 100) : 0;
};

const publishProgress = () => {
	if (running && percent() !== lastPercent) {
		lastPercent = percent();
		service()?.updateProgress(lastPercent);
	}
};

const sync = () => {
	const shouldRun = uploads.size > 0 && AppState.currentState === 'background';
	if (shouldRun && !running) {
		lastPercent = percent();
		service()?.start(I18n.t('Uploading'), I18n.t('Cancel'), lastPercent);
	} else if (!shouldRun && running) {
		service()?.stop();
	}
	running = shouldRun;
	publishProgress();
};

const cancelAll = async () => {
	await cancelAllUploads().catch(() => {});
	uploads.forEach(({ cancel }) => cancel());
};

export const beginUploadService = (cancel: () => void): number => {
	uploads.set(nextId, { loaded: 0, total: 0, cancel });
	if (!subscriptions.length) {
		subscriptions = [AppState.addEventListener('change', sync), DeviceEventEmitter.addListener('UploadServiceCancel', cancelAll)];
	}
	sync();
	return nextId++;
};

export const updateUploadService = (id: number, loaded: number, total: number): void => {
	const upload = uploads.get(id);
	if (!upload) {
		return;
	}
	Object.assign(upload, { loaded, total });
	publishProgress();
};

export const endUploadService = (id: number): void => {
	uploads.delete(id);
	if (!uploads.size) {
		subscriptions.forEach(subscription => subscription.remove());
		subscriptions = [];
	}
	sync();
};
