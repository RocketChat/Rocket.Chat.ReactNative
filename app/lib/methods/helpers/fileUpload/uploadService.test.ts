import { AppState, DeviceEventEmitter, NativeModules } from 'react-native';

import { cancelAllUploads } from '~/lib/methods/sendFileMessage/utils';
import { beginUploadService, endUploadService, updateUploadService } from './uploadService';

jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('~/lib/methods/sendFileMessage/utils', () => ({ cancelAllUploads: jest.fn(() => Promise.resolve()) }));

let onAppStateChange: (state: string) => void = () => {};
const mockRemove = jest.fn();
const noop = () => {};
const mockService = { start: jest.fn(), updateProgress: jest.fn(), stop: jest.fn() };

const setAppState = (state: string) => {
	(AppState as any).currentState = state;
	onAppStateChange(state);
};

describe('uploadService', () => {
	beforeAll(() => {
		NativeModules.UploadService = mockService;
		jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, handler: (state: string) => void) => {
			onAppStateChange = handler;
			return { remove: mockRemove };
		}) as any);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		setAppState('active');
	});

	it('runs the service only while an upload is active and the app is in background', () => {
		const id = beginUploadService(noop);
		expect(mockService.start).not.toHaveBeenCalled();
		setAppState('background');
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 0);
		setAppState('active');
		expect(mockService.stop).toHaveBeenCalledTimes(1);
		endUploadService(id);
	});

	it('starts straight away when an upload begins in background and stops when the last one ends', () => {
		setAppState('background');
		const a = beginUploadService(noop);
		const b = beginUploadService(noop);
		expect(mockService.start).toHaveBeenCalledTimes(1);
		endUploadService(a);
		expect(mockService.stop).not.toHaveBeenCalled();
		endUploadService(b);
		expect(mockService.stop).toHaveBeenCalledTimes(1);
	});

	it('reports the combined whole-number percentage and skips repeats', () => {
		setAppState('background');
		const a = beginUploadService(noop);
		const b = beginUploadService(noop);
		mockService.updateProgress.mockClear();
		updateUploadService(a, 100, 100);
		updateUploadService(b, 0, 100);
		updateUploadService(b, 0.4, 100);
		expect(mockService.updateProgress.mock.calls).toEqual([[100], [50]]);
		endUploadService(a);
		endUploadService(b);
	});

	it('starts with the current percentage and republishes it when an upload ends', () => {
		const a = beginUploadService(noop);
		updateUploadService(a, 100, 100);
		const b = beginUploadService(noop);
		setAppState('background');
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 100);
		updateUploadService(b, 0, 100);
		endUploadService(b);
		expect(mockService.updateProgress.mock.calls).toEqual([[50], [100]]);
		endUploadService(a);
	});

	it('does not report progress while in the foreground', () => {
		const id = beginUploadService(noop);
		updateUploadService(id, 50, 100);
		expect(mockService.updateProgress).not.toHaveBeenCalled();
		endUploadService(id);
	});

	it('still cancels registered uploads when clearing queued uploads fails', async () => {
		(cancelAllUploads as jest.Mock).mockRejectedValueOnce(new Error('db'));
		const cancel = jest.fn();
		const id = beginUploadService(cancel);
		DeviceEventEmitter.emit('UploadServiceCancel');
		await new Promise(resolve => setImmediate(resolve));
		expect(cancel).toHaveBeenCalledTimes(1);
		endUploadService(id);
	});

	it('cancels queued uploads and every registered upload when the notification Cancel button is tapped', async () => {
		const cancel = jest.fn();
		const id = beginUploadService(cancel);
		DeviceEventEmitter.emit('UploadServiceCancel');
		await Promise.resolve();
		await Promise.resolve();
		expect(cancelAllUploads).toHaveBeenCalledTimes(1);
		expect(cancel).toHaveBeenCalledTimes(1);
		endUploadService(id);
	});

	it('listens only while an upload is active', () => {
		const id = beginUploadService(noop);
		expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
		endUploadService(id);
		expect(mockRemove).toHaveBeenCalledTimes(1);
		DeviceEventEmitter.emit('UploadServiceCancel');
		expect(cancelAllUploads).not.toHaveBeenCalled();
	});
});
