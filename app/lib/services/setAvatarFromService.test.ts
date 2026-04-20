import { store as reduxStore } from '../store/auxStore';
import { uploadUserAvatarMultipart } from '../methods/uploadAvatar/uploadAvatar';
import sdk from './sdk';
import { setAvatarFromService } from './restApi';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(undefined),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

jest.mock('../methods/uploadAvatar/uploadAvatar', () => ({
	uploadUserAvatarMultipart: jest.fn().mockResolvedValue(undefined)
}));

const baseState = {
	server: { version: '8.0.0', server: 'https://open.rocket.chat' },
	login: { user: { id: 'uid1', token: 'tok1' } }
};

describe('setAvatarFromService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(reduxStore.getState as jest.Mock).mockReturnValue(baseState);
	});

	it('uses DDP below 8.0.0 with the same arguments as before', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			...baseState,
			server: { ...baseState.server, version: '7.9.0' }
		});
		const payload = {
			data: 'data:image/jpeg;base64,xx',
			contentType: 'image/jpeg',
			service: 'upload' as const,
			url: '/path/photo.jpg'
		};
		await setAvatarFromService(payload);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith(
			'setAvatarFromService',
			payload.data,
			payload.contentType,
			payload.service
		);
		expect(sdk.post).not.toHaveBeenCalled();
		expect(uploadUserAvatarMultipart).not.toHaveBeenCalled();
	});

	it('posts avatarUrl for service url on 8.0.0+', async () => {
		await setAvatarFromService({
			data: 'https://example.com/a.png',
			service: 'url',
			url: 'https://example.com/a.png'
		});
		expect(sdk.post).toHaveBeenCalledWith('users.setAvatar', {
			avatarUrl: 'https://example.com/a.png'
		});
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
		expect(uploadUserAvatarMultipart).not.toHaveBeenCalled();
	});

	it('multipart upload for camera/gallery (service upload) on 8.0.0+', async () => {
		await setAvatarFromService({
			data: '',
			contentType: 'image/jpeg',
			service: 'upload',
			url: 'file:///tmp/avatar.jpg'
		});
		expect(uploadUserAvatarMultipart).toHaveBeenCalledWith('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg');
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('does not multipart-upload when service is upload but url is http(s)', async () => {
		await setAvatarFromService({
			data: '',
			contentType: 'image/jpeg',
			service: 'upload',
			url: 'https://example.com/remote.jpg'
		});
		expect(sdk.post).toHaveBeenCalledWith('users.setAvatar', {
			avatarUrl: 'https://example.com/remote.jpg'
		});
		expect(uploadUserAvatarMultipart).not.toHaveBeenCalled();
	});

	it('posts avatarUrl for OAuth suggestion when url is http(s)', async () => {
		await setAvatarFromService({
			data: 'base64blob',
			contentType: 'image/jpeg',
			service: 'google',
			url: 'https://lh3.googleusercontent.com/a/abc'
		});
		expect(sdk.post).toHaveBeenCalledWith('users.setAvatar', {
			avatarUrl: 'https://lh3.googleusercontent.com/a/abc'
		});
		expect(uploadUserAvatarMultipart).not.toHaveBeenCalled();
	});

	// On 8.0.0+ only these shapes are handled: `service === 'url'` + string data, `service === 'upload'`
	// + non-http local url (multipart), or any `url` that is http(s) (JSON avatarUrl). OAuth suggestions
	// with base64 `data` and a non-http `url` (e.g. relative path) match none of those — invalid payload.
	it('throws on 8.0.0+ for OAuth-style payload with base64 data and non-http url', async () => {
		await expect(
			setAvatarFromService({
				data: 'dGVzdA==',
				contentType: 'image/png',
				service: 'github',
				url: 'relative/path'
			})
		).rejects.toThrow('Invalid avatar payload');
		expect(uploadUserAvatarMultipart).not.toHaveBeenCalled();
	});
});
