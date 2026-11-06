import { startIOSPIP } from '@livekit/react-native-webrtc';
import { Platform } from 'react-native';

import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import {
	enterConferencePictureInPicture,
	iosPictureInPictureSourceRef,
	setConferencePictureInPictureEnabled
} from '../conferencePictureInPicture';

jest.mock('~/lib/methods/helpers', () => {
	const { Platform: MockPlatform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...jest.requireActual('~/lib/methods/helpers') };
	Object.defineProperty(proxy, 'isIOS', {
		get() {
			return MockPlatform.OS === 'ios';
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(proxy, 'isAndroid', {
		get() {
			return MockPlatform.OS !== 'ios';
		},
		enumerable: true,
		configurable: true
	});
	return proxy;
});
jest.mock('@livekit/react-native-webrtc', () => ({ startIOSPIP: jest.fn() }));
jest.mock('~/lib/native/NativeConferenceCallAndroid', () => ({
	__esModule: true,
	default: { setPictureInPictureEnabled: jest.fn(), enterPictureInPicture: jest.fn() }
}));

const native = NativeConferenceCallAndroid as NonNullable<typeof NativeConferenceCallAndroid>;
const originalOS = Platform.OS;
const setPlatform = (os: 'ios' | 'android') => {
	(Platform as { OS: string }).OS = os;
};

afterAll(() => {
	setPlatform(originalOS as 'ios' | 'android');
});

describe('conferencePictureInPicture', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setPlatform('ios');
		iosPictureInPictureSourceRef.current = null;
	});

	describe('on iOS', () => {
		it('cannot enter before the video that feeds the window is on screen', async () => {
			await expect(enterConferencePictureInPicture()).resolves.toBe(false);

			expect(startIOSPIP).not.toHaveBeenCalled();
		});

		it('starts the window from the video that is on screen', async () => {
			iosPictureInPictureSourceRef.current = {} as never;

			await expect(enterConferencePictureInPicture()).resolves.toBe(true);

			expect(startIOSPIP).toHaveBeenCalledWith(iosPictureInPictureSourceRef);
		});

		it('leaves the window permission to the native view, so there is nothing to switch on', () => {
			setConferencePictureInPictureEnabled(true);

			expect(native.setPictureInPictureEnabled).not.toHaveBeenCalled();
		});
	});

	describe('on Android', () => {
		beforeEach(() => {
			setPlatform('android');
		});

		it('enters through the activity, not through the iOS window', async () => {
			(native.enterPictureInPicture as jest.Mock).mockResolvedValueOnce(true);

			await expect(enterConferencePictureInPicture()).resolves.toBe(true);
			expect(startIOSPIP).not.toHaveBeenCalled();
		});
	});
});
