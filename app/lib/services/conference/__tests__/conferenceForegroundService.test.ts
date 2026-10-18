import { DeviceEventEmitter, Platform } from 'react-native';

import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import {
	onConferenceNotificationAction,
	startConferenceForegroundService,
	updateConferenceNotification
} from '../conferenceForegroundService';

jest.mock('~/lib/methods/helpers', () => {
	const { Platform: MockPlatform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...jest.requireActual('~/lib/methods/helpers') };
	Object.defineProperty(proxy, 'isAndroid', {
		get() {
			return MockPlatform.OS !== 'ios';
		},
		enumerable: true,
		configurable: true
	});
	return proxy;
});
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/native/NativeConferenceCallAndroid', () => ({
	__esModule: true,
	default: {
		startConferenceCallService: jest.fn(() => Promise.resolve()),
		stopConferenceCallService: jest.fn(),
		updateConferenceCallNotification: jest.fn()
	}
}));

const native = NativeConferenceCallAndroid as NonNullable<typeof NativeConferenceCallAndroid>;
const originalOS = Platform.OS;

describe('conferenceForegroundService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(Platform as { OS: string }).OS = 'android';
	});

	afterAll(() => {
		(Platform as { OS: string }).OS = originalOS;
	});

	it('labels the notification buttons in the app language and says whether the microphone is on', () => {
		updateConferenceNotification(true);

		expect(native.updateConferenceCallNotification).toHaveBeenCalledWith(true, 'Mute', 'Unmute', 'Leave call');
	});

	it('hands the notification its buttons before the service shows it', async () => {
		await startConferenceForegroundService(false);

		expect(native.updateConferenceCallNotification).toHaveBeenCalledWith(false, 'Mute', 'Unmute', 'Leave call');
		expect(jest.mocked(native.updateConferenceCallNotification).mock.invocationCallOrder[0]).toBeLessThan(
			jest.mocked(native.startConferenceCallService).mock.invocationCallOrder[0]
		);
	});

	it('has no notification buttons to update on iOS', () => {
		(Platform as { OS: string }).OS = 'ios';

		updateConferenceNotification(true);

		expect(native.updateConferenceCallNotification).not.toHaveBeenCalled();
	});

	it('passes on the button the user pressed', () => {
		const listener = jest.fn();
		const subscription = onConferenceNotificationAction(listener);

		DeviceEventEmitter.emit('ConferenceNotificationAction', 'leave');
		subscription.remove();
		DeviceEventEmitter.emit('ConferenceNotificationAction', 'toggleMic');

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith('leave');
	});
});
