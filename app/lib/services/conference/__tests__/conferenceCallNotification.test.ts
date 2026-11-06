import { DeviceEventEmitter, Platform } from 'react-native';

import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import NativeConferenceLiveActivity from '~/lib/native/NativeConferenceLiveActivity';
import {
	onConferenceCallNotificationAction,
	startConferenceCallNotification,
	stopConferenceCallNotification,
	updateConferenceCallNotification
} from '../conferenceCallNotification';

jest.mock('~/lib/methods/helpers', () => {
	const { Platform: MockPlatform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...jest.requireActual('~/lib/methods/helpers') };
	Object.defineProperty(proxy, 'isAndroid', {
		get() {
			return MockPlatform.OS === 'android';
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(proxy, 'isIOS', {
		get() {
			return MockPlatform.OS === 'ios';
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
jest.mock('~/lib/native/NativeConferenceLiveActivity', () => ({
	__esModule: true,
	default: {
		startConferenceLiveActivity: jest.fn(),
		updateConferenceLiveActivity: jest.fn(),
		endConferenceLiveActivity: jest.fn(),
		addListener: jest.fn(),
		removeListeners: jest.fn()
	}
}));

const android = NativeConferenceCallAndroid as NonNullable<typeof NativeConferenceCallAndroid>;
const liveActivity = NativeConferenceLiveActivity as NonNullable<typeof NativeConferenceLiveActivity>;
const originalOS = Platform.OS;

const useOS = (os: 'android' | 'ios') => {
	(Platform as { OS: string }).OS = os;
};

describe('conferenceCallNotification', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		(Platform as { OS: string }).OS = originalOS;
	});

	describe('on Android', () => {
		beforeEach(() => useOS('android'));

		it('labels the notification buttons in the app language and says whether the microphone is on', () => {
			updateConferenceCallNotification(true);

			expect(android.updateConferenceCallNotification).toHaveBeenCalledWith(true, {
				mute: 'Mute',
				unmute: 'Unmute',
				leave: 'Leave call'
			});
			expect(liveActivity.updateConferenceLiveActivity).not.toHaveBeenCalled();
		});

		it('hands the notification its buttons before the service shows it', async () => {
			await startConferenceCallNotification(false);

			expect(android.updateConferenceCallNotification).toHaveBeenCalledWith(false, {
				mute: 'Mute',
				unmute: 'Unmute',
				leave: 'Leave call'
			});
			expect(jest.mocked(android.updateConferenceCallNotification).mock.invocationCallOrder[0]).toBeLessThan(
				jest.mocked(android.startConferenceCallService).mock.invocationCallOrder[0]
			);
			expect(liveActivity.startConferenceLiveActivity).not.toHaveBeenCalled();
		});

		it('stops the foreground service', () => {
			stopConferenceCallNotification();

			expect(android.stopConferenceCallService).toHaveBeenCalledTimes(1);
			expect(liveActivity.endConferenceLiveActivity).not.toHaveBeenCalled();
		});

		it('passes on the button the user pressed', () => {
			const listener = jest.fn();
			const subscription = onConferenceCallNotificationAction(listener);

			DeviceEventEmitter.emit('ConferenceNotificationAction', 'leave');
			subscription.remove();
			DeviceEventEmitter.emit('ConferenceNotificationAction', 'unmute');

			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith('leave');
		});
	});

	describe('on iOS', () => {
		beforeEach(() => useOS('ios'));

		it('starts a Live Activity titled for a conference call, with the buttons labelled in the app language', async () => {
			await startConferenceCallNotification(true);

			expect(liveActivity.startConferenceLiveActivity).toHaveBeenCalledWith('Conference call', true, {
				mute: 'Mute',
				unmute: 'Unmute',
				leave: 'Leave call'
			});
			expect(android.startConferenceCallService).not.toHaveBeenCalled();
		});

		it('keeps the Live Activity in step with the microphone', () => {
			updateConferenceCallNotification(false);

			expect(liveActivity.updateConferenceLiveActivity).toHaveBeenCalledWith(false, {
				mute: 'Mute',
				unmute: 'Unmute',
				leave: 'Leave call'
			});
			expect(android.updateConferenceCallNotification).not.toHaveBeenCalled();
		});

		it('ends the Live Activity', () => {
			stopConferenceCallNotification();

			expect(liveActivity.endConferenceLiveActivity).toHaveBeenCalledTimes(1);
			expect(android.stopConferenceCallService).not.toHaveBeenCalled();
		});

		it('listens through the native module and passes on the button the user pressed', () => {
			const listener = jest.fn();
			const subscription = onConferenceCallNotificationAction(listener);

			DeviceEventEmitter.emit('ConferenceNotificationAction', 'unmute');
			subscription.remove();

			expect(liveActivity.addListener).toHaveBeenCalledWith('ConferenceNotificationAction');
			expect(listener).toHaveBeenCalledWith('unmute');
		});
	});
});
