import * as LegacyFileSystem from 'expo-file-system/legacy';
import { File } from 'expo-file-system';

import { Upload } from './Upload';

const mockUpload = jest.fn();

jest.mock('expo-file-system', () => ({ UploadType: { MULTIPART: 1 }, File: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
	cacheDirectory: 'file:///cache/',
	makeDirectoryAsync: jest.fn(() => Promise.resolve()),
	copyAsync: jest.fn(() => Promise.resolve()),
	deleteAsync: jest.fn(() => Promise.resolve()),
	readDirectoryAsync: jest.fn(() => Promise.resolve([])),
	getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 100 })),
	getFreeDiskStorageAsync: jest.fn(() => Promise.resolve(1000))
}));

const createUpload = (uri: string, filename?: string) => {
	const upload = new Upload();
	upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', { 'X-Auth-Token': 'token' });
	upload.appendFile({ name: 'file', type: 'video/mp4', uri, filename });
	return upload;
};

const stagedName = () => decodeURIComponent((LegacyFileSystem.copyAsync as jest.Mock).mock.calls[0][0].to.split('/').pop());

describe('Upload', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUpload.mockResolvedValue({ status: 200, body: '{"success":true}', headers: {} });
		(File as unknown as jest.Mock).mockImplementation(() => ({ upload: mockUpload }));
	});

	it('uploads as multipart with string fields as parameters', async () => {
		const upload = createUpload('file:///cache/video.mp4', 'video.mp4');
		upload.appendFile({ name: 'description', data: 'Описание' });
		await expect(upload.send()).resolves.toEqual({ success: true });
		expect(mockUpload).toHaveBeenCalledWith(
			'https://open.rocket.chat/api/v1/rooms.media/rid',
			expect.objectContaining({
				uploadType: 1,
				fieldName: 'file',
				mimeType: 'video/mp4',
				headers: { 'X-Auth-Token': 'token' },
				parameters: { description: 'Описание' }
			})
		);
	});

	it('uploads the original file when it already carries the right name', async () => {
		await createUpload('file:///cache/video.mp4', 'video.mp4').send();
		expect(LegacyFileSystem.copyAsync).not.toHaveBeenCalled();
	});

	it.each([
		['Пример видео.mov', 'Пример видео.mov'],
		['100%.pdf', '100%.pdf'],
		['a/b\r\nc.mov', 'a_b__c.mov'],
		['a"b.mov', 'a%22b.mov']
	])('stages the file so the server receives %j as %j', async (filename, expected) => {
		await createUpload('file:///cache/ph-1.mov', filename).send();
		expect(stagedName()).toBe(expected);
	});

	it('removes the staged copy whether the upload succeeds or fails', async () => {
		await createUpload('file:///cache/ph-1.mov', 'clip.mov').send();
		mockUpload.mockRejectedValue(new Error('Network request failed'));
		await expect(createUpload('file:///cache/ph-1.mov', 'clip.mov').send()).rejects.toThrow('Network request failed');
		expect(LegacyFileSystem.deleteAsync).toHaveBeenCalledTimes(2);
	});

	it('removes staging folders older than a day and keeps recent ones', async () => {
		const recent = `${Date.now()}-abc`;
		(LegacyFileSystem.readDirectoryAsync as jest.Mock).mockResolvedValueOnce([
			`${Date.now() - 2 * 24 * 60 * 60 * 1000}-old`,
			recent
		]);
		await createUpload('file:///cache/ph-1.mov', 'clip.mov').send();
		const deleted = (LegacyFileSystem.deleteAsync as jest.Mock).mock.calls.map(([path]) => path);
		expect(deleted.some(path => path.endsWith('-old'))).toBe(true);
		expect(deleted.some(path => path.endsWith(recent))).toBe(false);
	});

	it('refuses to stage a copy that does not fit in the free storage', async () => {
		(LegacyFileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValueOnce(150);
		await expect(createUpload('file:///cache/ph-1.mov', 'clip.mov').send()).rejects.toThrow('Not enough storage');
		expect(LegacyFileSystem.copyAsync).not.toHaveBeenCalled();
	});

	it('rejects on a failing status', async () => {
		mockUpload.mockResolvedValue({ status: 413, body: '', headers: {} });
		await expect(createUpload('file:///cache/video.mp4', 'video.mp4').send()).rejects.toThrow('Error: 413');
	});

	it('rejects with Upload Cancelled after cancel()', async () => {
		const upload = createUpload('file:///cache/video.mp4', 'video.mp4');
		mockUpload.mockImplementation(() => {
			upload.cancel();
			return Promise.reject(new Error('AbortError'));
		});
		await expect(upload.send()).rejects.toThrow('Upload Cancelled');
	});

	it('reports progress and refuses to send without a file', async () => {
		const progress = jest.fn();
		const upload = new Upload();
		upload.setupRequest('https://x', {}, progress);
		await expect(upload.send()).rejects.toThrow('No file to upload');
		upload.appendFile({ name: 'file', uri: 'file:///cache/v.mp4', filename: 'v.mp4' });
		await upload.send();
		mockUpload.mock.calls[0][1].onProgress({ bytesSent: 5, totalBytes: 10 });
		expect(progress).toHaveBeenCalledWith(5, 10);
	});
});
