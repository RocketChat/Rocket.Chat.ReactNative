import FileUpload from '../../helpers/fileUpload';
import { trackUpload } from '../../helpers/fileUpload/uploadService';
import { sendFileMessage } from '../sendFileMessage';
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
const send = () => sendFileMessage('rid', { ...fileInfo }, undefined, 'https://open.rocket.chat', { id: 'uid', token: 'token' });
const cancelFromNotification = () => (trackUpload as jest.Mock).mock.calls[0][0]();

describe('sendFileMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockOrder.length = 0;
		Object.keys(uploadQueue).forEach(key => delete uploadQueue[key]);
		(createUploadRecord as jest.Mock).mockResolvedValue(['clip-rid', record]);
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
				return { success: true };
			}),
			cancel: jest.fn()
		}));
	});

	it('tracks the whole flow: starts before the file is prepared and ends after the upload', async () => {
		await send();
		expect(mockOrder).toEqual(['track', 'copy', 'send', 'end']);
	});

	it('forwards the upload progress to the tracker', async () => {
		await send();
		expect(mockTracker.progress).toHaveBeenCalledWith(5, 10);
	});

	it('cancels the upload through cancelUpload when the tracker cancel callback runs', async () => {
		(FileUpload as jest.Mock).mockImplementation(() => ({
			send: jest.fn(async () => {
				cancelFromNotification();
				return { success: true };
			}),
			cancel: jest.fn()
		}));
		await send();
		expect(cancelUpload).toHaveBeenCalledWith(record, 'rid');
	});

	it('stops without uploading when it is cancelled while the file is being prepared', async () => {
		(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockImplementation(async (path: string) => {
			cancelFromNotification();
			return path;
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
		expect(cancelUpload).toHaveBeenCalledWith(record, 'rid');
		expect(FileUpload).not.toHaveBeenCalled();
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

	it('ends the tracker without uploading when no upload record can be created', async () => {
		(createUploadRecord as jest.Mock).mockResolvedValue([null, null]);
		await send();
		expect(FileUpload).not.toHaveBeenCalled();
		expect(mockTracker.end).toHaveBeenCalledTimes(1);
	});
});
