import { Platform } from 'react-native';

import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import { startConferenceMicLevelMonitor, stopConferenceMicLevelMonitor } from '../conferenceMicLevel';

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
jest.mock('~/lib/native/NativeConferenceCallAndroid', () => ({
	__esModule: true,
	default: { startMicLevelMonitor: jest.fn(), stopMicLevelMonitor: jest.fn(() => Promise.resolve()) }
}));

const native = NativeConferenceCallAndroid as NonNullable<typeof NativeConferenceCallAndroid>;
const originalOS = Platform.OS;

afterAll(() => {
	(Platform as { OS: string }).OS = originalOS;
});

describe('conferenceMicLevel', () => {
	it('cannot listen to the microphone on iOS, and does not try', async () => {
		(Platform as { OS: string }).OS = 'ios';

		await expect(startConferenceMicLevelMonitor()).resolves.toBe(false);
		await stopConferenceMicLevelMonitor();

		expect(native.startMicLevelMonitor).not.toHaveBeenCalled();
		expect(native.stopMicLevelMonitor).not.toHaveBeenCalled();
	});
});
