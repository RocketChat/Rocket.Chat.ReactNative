import { DeviceEventEmitter, NativeModules } from 'react-native';

import { type IUploadTracker } from '../definitions';
import { trackUpload } from '../uploadService.android';

jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const noop = () => {};
const mockService = { start: jest.fn(), updateProgress: jest.fn(), stop: jest.fn() };
const trackers: IUploadTracker[] = [];

const track = (cancel: () => void = noop) => {
	const tracker = trackUpload(cancel);
	trackers.push(tracker);
	return tracker;
};

describe('uploadService (Android)', () => {
	beforeAll(() => {
		NativeModules.UploadService = mockService;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockService.start.mockImplementation(() => Promise.resolve());
	});

	afterEach(() => {
		trackers.splice(0).forEach(tracker => tracker.end());
	});

	it('starts the service as soon as an upload is tracked, before any bytes are sent', () => {
		track();
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 0);
	});

	it('runs one service for several uploads and stops it when the last one ends', () => {
		const a = track();
		const b = track();
		expect(mockService.start).toHaveBeenCalledTimes(1);
		a.end();
		expect(mockService.stop).not.toHaveBeenCalled();
		b.end();
		expect(mockService.stop).toHaveBeenCalledTimes(1);
	});

	it('reports the combined whole-number percentage and skips repeats', () => {
		const a = track();
		const b = track();
		mockService.updateProgress.mockClear();
		a.progress(100, 100);
		b.progress(0, 100);
		b.progress(0.4, 100);
		expect(mockService.updateProgress.mock.calls).toEqual([[100], [50]]);
	});

	it('republishes the combined percentage when an upload ends', () => {
		const a = track();
		a.progress(100, 100);
		const b = track();
		b.progress(0, 100);
		b.end();
		expect(mockService.updateProgress.mock.calls).toEqual([[100], [50], [100]]);
	});

	it('lets the next change retry when the system refuses to start the service', async () => {
		mockService.start.mockImplementationOnce(() => Promise.reject(new Error('ForegroundServiceStartNotAllowedException')));
		track();
		await new Promise(resolve => setImmediate(resolve));
		track();
		expect(mockService.start).toHaveBeenCalledTimes(2);
	});

	it('starts the service again from the next progress after the system refused to start it', async () => {
		mockService.start.mockImplementationOnce(() => Promise.reject(new Error('ForegroundServiceStartNotAllowedException')));
		const upload = track();
		await new Promise(resolve => setImmediate(resolve));
		upload.progress(5, 10);
		expect(mockService.start).toHaveBeenCalledTimes(2);
		expect(mockService.start).toHaveBeenLastCalledWith('Uploading', 'Cancel', 50);
	});

	it('keeps the newer service run when an earlier start fails late', async () => {
		let failFirstStart: (error: Error) => void = noop;
		const firstStart = new Promise((_resolve, reject) => {
			failFirstStart = reject;
		});
		mockService.start.mockImplementationOnce(() => firstStart);
		track().end();
		const second = track();
		failFirstStart(new Error('ForegroundServiceStartNotAllowedException'));
		await new Promise(resolve => setImmediate(resolve));
		second.end();
		expect(mockService.stop).toHaveBeenCalledTimes(2);
	});

	it('cancels every tracked upload when the notification Cancel button is tapped', () => {
		const first = jest.fn();
		const second = jest.fn();
		track(first);
		track(second);
		DeviceEventEmitter.emit('UploadServiceCancel');
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('listens for the notification Cancel button only while an upload is tracked', () => {
		const upload = track();
		expect(DeviceEventEmitter.listenerCount('UploadServiceCancel')).toBe(1);
		upload.end();
		expect(DeviceEventEmitter.listenerCount('UploadServiceCancel')).toBe(0);
	});
});
