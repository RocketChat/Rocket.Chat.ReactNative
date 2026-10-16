import { AppState, DeviceEventEmitter, NativeModules } from 'react-native';

import { type IUploadTracker } from '../definitions';
import { trackUpload } from '../uploadService.android';

jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

let onAppStateChange: (state: string) => void = () => {};
const mockRemove = jest.fn();
const noop = () => {};
const mockService = { start: jest.fn(), updateProgress: jest.fn(), stop: jest.fn() };
const trackers: IUploadTracker[] = [];

const track = (cancel: () => void = noop) => {
	const tracker = trackUpload(cancel);
	trackers.push(tracker);
	return tracker;
};

const setAppState = (state: string) => {
	(AppState as any).currentState = state;
	onAppStateChange(state);
};

describe('uploadService (Android)', () => {
	beforeAll(() => {
		NativeModules.UploadService = mockService;
		jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, handler: (state: string) => void) => {
			onAppStateChange = handler;
			return { remove: mockRemove };
		}) as any);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockService.start.mockImplementation(() => Promise.resolve());
		setAppState('active');
	});

	afterEach(() => {
		trackers.splice(0).forEach(tracker => tracker.end());
	});

	it('runs the service only while an upload is tracked and the app is in background', () => {
		track();
		expect(mockService.start).not.toHaveBeenCalled();
		setAppState('background');
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 0);
		setAppState('active');
		expect(mockService.stop).toHaveBeenCalledTimes(1);
	});

	it('starts straight away when an upload is tracked in background and stops when the last one ends', () => {
		setAppState('background');
		const a = track();
		const b = track();
		expect(mockService.start).toHaveBeenCalledTimes(1);
		a.end();
		expect(mockService.stop).not.toHaveBeenCalled();
		b.end();
		expect(mockService.stop).toHaveBeenCalledTimes(1);
	});

	it('reports the combined whole-number percentage and skips repeats', () => {
		setAppState('background');
		const a = track();
		const b = track();
		mockService.updateProgress.mockClear();
		a.progress(100, 100);
		b.progress(0, 100);
		b.progress(0.4, 100);
		expect(mockService.updateProgress.mock.calls).toEqual([[100], [50]]);
	});

	it('starts with the current percentage and republishes it when an upload ends', () => {
		const a = track();
		a.progress(100, 100);
		const b = track();
		setAppState('background');
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 100);
		b.progress(0, 100);
		b.end();
		expect(mockService.updateProgress.mock.calls).toEqual([[50], [100]]);
	});

	it('does not report progress while in the foreground', () => {
		track().progress(50, 100);
		expect(mockService.updateProgress).not.toHaveBeenCalled();
	});

	it('keeps the service running through the preparation phase before any bytes are sent', () => {
		setAppState('background');
		const upload = track();
		expect(mockService.start).toHaveBeenCalledWith('Uploading', 'Cancel', 0);
		upload.progress(10, 100);
		expect(mockService.stop).not.toHaveBeenCalled();
		upload.end();
		expect(mockService.stop).toHaveBeenCalledTimes(1);
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

	it('listens only while an upload is tracked', () => {
		const upload = track();
		expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
		expect(DeviceEventEmitter.listenerCount('UploadServiceCancel')).toBe(1);
		upload.end();
		expect(mockRemove).toHaveBeenCalledTimes(1);
		expect(DeviceEventEmitter.listenerCount('UploadServiceCancel')).toBe(0);
	});

	it('lets the next change retry when the system refuses to start the service', async () => {
		mockService.start.mockImplementationOnce(() => Promise.reject(new Error('ForegroundServiceStartNotAllowedException')));
		setAppState('background');
		track();
		await new Promise(resolve => setImmediate(resolve));
		track();
		expect(mockService.start).toHaveBeenCalledTimes(2);
	});
});
