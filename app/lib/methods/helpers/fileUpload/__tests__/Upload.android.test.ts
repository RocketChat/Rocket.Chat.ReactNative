import * as FileSystem from 'expo-file-system/legacy';

import { Upload } from '../Upload.android';
import { beginUploadService, endUploadService, updateUploadService } from '../uploadService';

jest.mock('expo-file-system/legacy', () => ({ createUploadTask: jest.fn(), FileSystemUploadType: { MULTIPART: 1 } }));
jest.mock('../uploadService', () => ({
	beginUploadService: jest.fn(() => 7),
	updateUploadService: jest.fn(),
	endUploadService: jest.fn()
}));

type TProgress = { totalBytesSent: number; totalBytesExpectedToSend: number };

const createUpload = () => {
	const upload = new Upload();
	upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
	upload.appendFile({ name: 'file', type: 'video/mp4', uri: 'file:///cache/video.mp4', filename: 'video.mp4' });
	return upload;
};

describe('Upload (Android)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('tracks the upload in the upload service from start to finish and reports its progress', async () => {
		(FileSystem.createUploadTask as jest.Mock).mockImplementation(
			(_url: string, _uri: string, _options: unknown, onProgress: (data: TProgress) => void) => ({
				uploadAsync: jest.fn(() => {
					expect(endUploadService).not.toHaveBeenCalled();
					onProgress({ totalBytesSent: 5, totalBytesExpectedToSend: 10 });
					return Promise.resolve({ status: 200, body: '{"success":true}' });
				})
			})
		);
		await expect(createUpload().send()).resolves.toEqual({ success: true });
		expect(beginUploadService).toHaveBeenCalledTimes(1);
		expect(updateUploadService).toHaveBeenCalledWith(7, 5, 10);
		expect(endUploadService).toHaveBeenCalledWith(7);
	});

	it('stops tracking the upload when it fails', async () => {
		(FileSystem.createUploadTask as jest.Mock).mockReturnValue({
			uploadAsync: jest.fn(() => Promise.reject(new Error('Network request failed')))
		});
		await expect(createUpload().send()).rejects.toThrow('Network request failed');
		expect(endUploadService).toHaveBeenCalledWith(7);
	});
});
