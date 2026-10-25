import { Encryption } from '~/lib/encryption';
import fetch from '../../helpers/fetch';
import FileUpload from '../../helpers/fileUpload';
import { trackUpload } from '../../helpers/fileUpload/uploadService';
import { sendFileMessageV2 } from '../sendFileMessageV2';
import { cancelUpload, copyFileToCacheDirectoryIfNeeded, createUploadRecord, persistUploadError, uploadQueue } from '../utils';

const mockOrder: string[] = [];
const mockTracker = {
	progress: jest.fn(),
	end: jest.fn(() => mockOrder.push('end'))
};

jest.mock('@rocket.chat/sdk', () => ({ settings: { customHeaders: {} } }));
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { write: (cb: () => Promise<unknown>) => cb() } }
}));
jest.mock('~/lib/encryption', () => ({ Encryption: { encryptFile: jest.fn() } }));
jest.mock('../../helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../helpers/fileUpload', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../helpers/fileUpload/uploadService', () => ({ trackUpload: jest.fn() }));
jest.mock('../utils', () => ({
	cancelUpload: jest.fn(),
	createUploadRecord: jest.fn(),
	copyFileToCacheDirectoryIfNeeded: jest.fn(),
	persistUploadError: jest.fn(),
	uploadQueue: {}
}));

const fileInfo = { path: 'file:///cache/clip.mp4', name: 'clip.mp4', type: 'video/mp4', size: 10 };
const record = { update: jest.fn(), destroyPermanently: jest.fn() };
const send = () => sendFileMessageV2('rid', fileInfo, undefined, 'https://open.rocket.chat', { id: 'uid', token: 'token' });
const cancelFromNotification = () => (trackUpload as jest.Mock).mock.calls[0][0]();
const uploaded = { file: { _id: 'fid', url: '/file-upload/fid' } };

describe('sendFileMessageV2', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockOrder.length = 0;
		Object.keys(uploadQueue).forEach(key => delete uploadQueue[key]);
		jest.spyOn(console, 'error').mockImplementation(() => {});
		(createUploadRecord as jest.Mock).mockResolvedValue(['clip-rid', record]);
		(Encryption.encryptFile as jest.Mock).mockImplementation(async () => {
			mockOrder.push('encrypt');
			return { file: { ...fileInfo }, getContent: undefined, fileContent: undefined };
		});
		(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockImplementation(async (path: string) => {
			mockOrder.push('copy');
			return path;
		});
		(trackUpload as jest.Mock).mockImplementation(() => {
			mockOrder.push('track');
			return mockTracker;
		});
		(FileUpload as jest.Mock).mockImplementation((_url, _headers, _data, onProgress) => ({
			send: jest.fn(async () => {
				mockOrder.push('send');
				await onProgress(5, 10);
				return uploaded;
			}),
			cancel: jest.fn()
		}));
		(fetch as jest.Mock).mockImplementation(async () => {
			mockOrder.push('confirm');
			return {};
		});
	});

	it('tracks the whole flow: starts before the file is prepared and ends after the message is confirmed', async () => {
		await send();
		expect(mockOrder).toEqual(['track', 'encrypt', 'copy', 'send', 'confirm', 'end']);
	});

	it('forwards the upload progress to the tracker', async () => {
		await send();
		expect(mockTracker.progress).toHaveBeenCalledWith(5, 10);
	});

	it('cancels the upload through cancelUpload when the tracker cancel callback runs', async () => {
		(FileUpload as jest.Mock).mockImplementation(() => ({
			send: jest.fn(async () => {
				cancelFromNotification();
				return uploaded;
			}),
			cancel: jest.fn()
		}));
		await send();
		expect(cancelUpload).toHaveBeenCalledWith(record, 'rid');
	});

	it('stops without uploading when it is cancelled while the file is being prepared', async () => {
		(Encryption.encryptFile as jest.Mock).mockImplementation(async () => {
			cancelFromNotification();
			return { file: { ...fileInfo }, getContent: undefined, fileContent: undefined };
		});
		await send();
		expect(FileUpload).not.toHaveBeenCalled();
		expect(persistUploadError).not.toHaveBeenCalled();
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});

	it('removes the upload record when it is cancelled while the record is being created', async () => {
		(createUploadRecord as jest.Mock).mockImplementation(async () => {
			cancelFromNotification();
			return ['clip-rid', record];
		});
		await send();
		expect(cancelUpload).toHaveBeenCalledTimes(1);
		expect(cancelUpload).toHaveBeenCalledWith(record, 'rid');
		expect(FileUpload).not.toHaveBeenCalled();
	});

	it('does not confirm the message when it is cancelled while the upload finishes', async () => {
		(FileUpload as jest.Mock).mockImplementation(() => ({
			send: jest.fn(async () => {
				cancelFromNotification();
				return uploaded;
			}),
			cancel: jest.fn()
		}));
		await send();
		expect(fetch).not.toHaveBeenCalled();
		expect(persistUploadError).not.toHaveBeenCalled();
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});

	it('confirms the upload with the message text, the thread and the description', async () => {
		(Encryption.encryptFile as jest.Mock).mockImplementation(async () => ({
			file: { ...fileInfo, msg: 'hello', description: 'a clip' },
			getContent: undefined,
			fileContent: undefined
		}));
		await sendFileMessageV2('rid', fileInfo, 'tmid1', 'https://open.rocket.chat', { id: 'uid', token: 'token' });
		const [url, options] = (fetch as jest.Mock).mock.calls[0];
		expect(url).toBe('https://open.rocket.chat/api/v1/rooms.mediaConfirm/rid/fid');
		expect(JSON.parse(options.body)).toEqual({ msg: 'hello', tmid: 'tmid1', description: 'a clip' });
	});

	it('confirms an encrypted upload with its content and without the message text', async () => {
		const content = { algorithm: 'rc.v2.aes-sha2', ciphertext: 'abc' };
		(Encryption.encryptFile as jest.Mock).mockImplementation(async () => ({
			file: { ...fileInfo, msg: 'secret' },
			getContent: jest.fn().mockResolvedValue(content),
			fileContent: undefined
		}));
		await send();
		const [, options] = (fetch as jest.Mock).mock.calls[0];
		expect(JSON.parse(options.body)).toEqual({ t: 'e2e', content });
	});

	it('ends the tracker and rethrows when the upload fails', async () => {
		(FileUpload as jest.Mock).mockImplementation(() => ({
			send: jest.fn().mockRejectedValue(new Error('Network request failed')),
			cancel: jest.fn()
		}));
		await expect(send()).rejects.toThrow('Network request failed');
		expect(persistUploadError).toHaveBeenCalledWith(fileInfo.path, 'rid');
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});

	it('ends the tracker when the file cannot be prepared', async () => {
		(Encryption.encryptFile as jest.Mock).mockRejectedValue(new Error('encryption failed'));
		await send().catch(() => undefined);
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});
});
