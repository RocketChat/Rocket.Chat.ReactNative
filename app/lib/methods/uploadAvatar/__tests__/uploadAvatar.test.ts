import FileUpload from '../../helpers/fileUpload';
import { trackUpload } from '../../helpers/fileUpload/uploadService';
import { copyFileToCacheDirectoryIfNeeded } from '../../sendFileMessage/utils';
import { store as reduxStore } from '~/lib/store/auxStore';
import { uploadUserAvatarMultipart } from '../uploadAvatar';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../../helpers/fileUpload', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		send: jest.fn().mockResolvedValue({ success: true })
	}))
}));

jest.mock('../../helpers/fileUpload/uploadService', () => ({ trackUpload: jest.fn() }));

jest.mock('../../sendFileMessage/utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn((p: string) => Promise.resolve(`cached:${p}`))
}));

jest.mock('@rocket.chat/sdk', () => ({
	settings: { customHeaders: { 'X-Custom': 'custom' } }
}));

const mockTracker = { progress: jest.fn(), end: jest.fn() };

const baseState = {
	server: { server: 'https://open.rocket.chat' },
	login: { user: { id: 'uid1', token: 'tok1' } }
};

describe('uploadAvatar helper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(reduxStore.getState as jest.Mock).mockReturnValue(baseState);
		(trackUpload as jest.Mock).mockReturnValue(mockTracker);
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

	it('tracks the upload from before the file is cached until it finishes', async () => {
		const send = jest.fn().mockResolvedValue({ success: true });
		(FileUpload as jest.Mock).mockImplementationOnce(() => ({ send, cancel: jest.fn() }));

		await uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg');

		const [tracked] = (trackUpload as jest.Mock).mock.invocationCallOrder;
		const [cached] = (copyFileToCacheDirectoryIfNeeded as jest.Mock).mock.invocationCallOrder;
		const [sent] = send.mock.invocationCallOrder;
		const [ended] = mockTracker.end.mock.invocationCallOrder;
		expect(tracked).toBeLessThan(cached);
		expect(sent).toBeLessThan(ended);
	});

	it('hands the tracker progress callback to the upload', async () => {
		await uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg');

		const onProgress = (FileUpload as jest.Mock).mock.calls[0][3];
		onProgress(1, 2);
		expect(mockTracker.progress).toHaveBeenCalledWith(1, 2);
	});

	it('ends tracking and rethrows when the upload fails', async () => {
		(FileUpload as jest.Mock).mockImplementationOnce(() => ({
			send: jest.fn().mockRejectedValue(new Error('Network request failed')),
			cancel: jest.fn()
		}));

		await expect(uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg')).rejects.toThrow(
			'Network request failed'
		);
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});

	it('does not upload when it is cancelled while the file is being cached', async () => {
		(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockImplementationOnce(async (p: string) => {
			(trackUpload as jest.Mock).mock.calls[0][0]();
			return `cached:${p}`;
		});

		await expect(uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg')).rejects.toThrow(
			'Upload Cancelled'
		);
		expect(FileUpload).not.toHaveBeenCalled();
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});

	it('aborts the upload when the tracker cancel callback runs', async () => {
		const cancel = jest.fn();
		(FileUpload as jest.Mock).mockImplementationOnce(() => ({
			send: jest.fn(() => {
				(trackUpload as jest.Mock).mock.calls[0][0]();
				return Promise.resolve({ success: true });
			}),
			cancel
		}));

		await uploadUserAvatarMultipart('file:///tmp/avatar.jpg', 'image/jpeg', 'avatar.jpg');

		expect(cancel).toHaveBeenCalledTimes(1);
	});
});
