import FileUpload from '../helpers/fileUpload';
import { copyFileToCacheDirectoryIfNeeded } from '../sendFileMessage/utils';
import { store as reduxStore } from '../../store/auxStore';
import { uploadUserAvatarMultipart } from './uploadAvatar';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../helpers/fileUpload', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		send: jest.fn().mockResolvedValue({ success: true })
	}))
}));

jest.mock('../sendFileMessage/utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn((p: string) => Promise.resolve(`cached:${p}`))
}));

jest.mock('@rocket.chat/sdk', () => ({
	settings: { customHeaders: { 'X-Custom': 'custom' } }
}));

const baseState = {
	server: { server: 'https://open.rocket.chat' },
	login: { user: { id: 'uid1', token: 'tok1' } }
};

describe('uploadAvatar helper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(reduxStore.getState as jest.Mock).mockReturnValue(baseState);
	});

	it('uploads multipart avatar using cached local file and auth headers', async () => {
		await uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg');

		expect(copyFileToCacheDirectoryIfNeeded).toHaveBeenCalledWith('file:///tmp/avatar.jpg', 'avatar.jpg');
		expect(FileUpload).toHaveBeenCalledTimes(1);
		const [uploadUrl, headers, formData] = (FileUpload as jest.Mock).mock.calls[0];
		expect(uploadUrl).toBe('https://open.rocket.chat/api/v1/users.setAvatar');
		expect(headers).toEqual(
			expect.objectContaining({
				'X-Custom': 'custom',
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': 'tok1',
				'X-User-Id': 'uid1'
			})
		);
		expect(formData).toEqual([
			{
				name: 'image',
				uri: 'cached:file:///tmp/avatar.jpg',
				type: 'image/jpeg',
				filename: 'avatar.jpg'
			}
		]);
	});
});
