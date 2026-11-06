import { Platform } from 'react-native';

import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import { consumeConferenceCallOpenRequest } from '../conferenceCallOpenRequest';

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
	default: { consumeOpenCallRequest: jest.fn() }
}));

const native = NativeConferenceCallAndroid as NonNullable<typeof NativeConferenceCallAndroid>;
const originalOS = Platform.OS;

afterAll(() => {
	(Platform as { OS: string }).OS = originalOS;
});

describe('conferenceCallOpenRequest', () => {
	it('never has a tap to report on iOS, where the call has no notification', async () => {
		(Platform as { OS: string }).OS = 'ios';

		await expect(consumeConferenceCallOpenRequest()).resolves.toBe(false);
		expect(native.consumeOpenCallRequest).not.toHaveBeenCalled();
	});
});
