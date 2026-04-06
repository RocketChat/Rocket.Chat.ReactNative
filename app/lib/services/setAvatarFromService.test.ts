import * as FileSystem from 'expo-file-system/legacy';

import FileUpload from '../methods/helpers/fileUpload';
import { copyFileToCacheDirectoryIfNeeded } from '../methods/sendFileMessage/utils';
import { store as reduxStore } from '../store/auxStore';
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

jest.mock('../methods/helpers/fileUpload', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		send: jest.fn().mockResolvedValue({ success: true })
	}))
}));

jest.mock('../methods/sendFileMessage/utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn((p: string) => Promise.resolve(`cached:${p}`))
}));

jest.mock('@rocket.chat/sdk', () => ({
	settings: { customHeaders: {} }
}));

jest.mock('expo-file-system/legacy', () => ({
	cacheDirectory: 'file:///cache/',
	EncodingType: { Base64: 'base64' },
	writeAsStringAsync: jest.fn(() => Promise.resolve())
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
		expect(FileUpload).not.toHaveBeenCalled();
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
		expect(FileUpload).not.toHaveBeenCalled();
	});

	it('multipart upload for camera/gallery (service upload) on 8.0.0+', async () => {
		await setAvatarFromService({
			data: '',
			contentType: 'image/jpeg',
			service: 'upload',
			url: 'file:///tmp/avatar.jpg'
		});
		expect(FileUpload).toHaveBeenCalledTimes(1);
		const [uploadUrl, headers, formData] = (FileUpload as jest.Mock).mock.calls[0];
		expect(uploadUrl).toBe('https://open.rocket.chat/api/v1/users.setAvatar');
		expect(headers['X-Auth-Token']).toBe('tok1');
		expect(headers['X-User-Id']).toBe('uid1');
		expect(formData).toEqual([
			{
				name: 'image',
				uri: 'cached:file:///tmp/avatar.jpg',
				type: 'image/jpeg',
				filename: 'avatar.jpg'
			}
		]);
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
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
		expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
	});

	it('writes blob to cache and multipart upload when no http url on 8.0.0+', async () => {
		await setAvatarFromService({
			data: 'dGVzdA==',
			contentType: 'image/png',
			service: 'github',
			url: 'relative/path'
		});
		expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
		expect(copyFileToCacheDirectoryIfNeeded).toHaveBeenCalled();
		expect(FileUpload).toHaveBeenCalled();
		const [, , formData] = (FileUpload as jest.Mock).mock.calls[0];
		expect(formData[0].name).toBe('image');
	});
});
