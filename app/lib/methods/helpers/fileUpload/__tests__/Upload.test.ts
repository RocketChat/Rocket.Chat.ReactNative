import { File } from 'expo-file-system';

import { Upload } from '../Upload';

const mockUpload = jest.fn();

jest.mock('expo-file-system', () => ({ UploadType: { MULTIPART: 1 }, File: jest.fn() }));

const createUpload = (uri: string, filename?: string) => {
	const upload = new Upload();
	upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', { 'X-Auth-Token': 'token' });
	upload.appendFile({ name: 'file', type: 'video/mp4', uri, filename });
	return upload;
};

describe('Upload', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUpload.mockResolvedValue({ status: 200, body: '{"success":true}', headers: {} });
		(File as unknown as jest.Mock).mockImplementation(() => ({ upload: mockUpload, exists: true }));
	});

	it('uploads as multipart on a background session with string fields as parameters', async () => {
		const upload = createUpload('file:///cache/video.mp4', 'video.mp4');
		upload.appendFile({ name: 'description', data: 'Описание' });
		await expect(upload.send()).resolves.toEqual({ success: true });
		expect(mockUpload).toHaveBeenCalledWith(
			'https://open.rocket.chat/api/v1/rooms.media/rid',
			expect.objectContaining({
				uploadType: 1,
				sessionType: 'background',
				fieldName: 'file',
				mimeType: 'video/mp4',
				headers: { 'X-Auth-Token': 'token' },
				parameters: { description: 'Описание' },
				signal: expect.any(AbortSignal)
			})
		);
	});

	it.each([
		['video.mp4', 'video.mp4'],
		['Пример видео.mov', 'Пример видео.mov'],
		['100%.pdf', '100%.pdf'],
		['a/b\r\nc.mov', 'a_b__c.mov'],
		['a"b.mov', 'a%22b.mov']
	])('uploads the original file and sends %j to the native upload as %j', async (filename, expected) => {
		await createUpload('file:///cache/ph-1.mov', filename).send();
		expect(File).toHaveBeenCalledWith('file:///cache/ph-1.mov');
		expect(mockUpload).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ filename: expected }));
	});

	it('leaves the native filename unset when the file has no name', async () => {
		await createUpload('file:///cache/ph-1.mov').send();
		expect(mockUpload.mock.calls[0][1].filename).toBeUndefined();
	});

	it('rejects without uploading when the file no longer exists', async () => {
		(File as unknown as jest.Mock).mockImplementation(() => ({ upload: mockUpload, exists: false }));
		await expect(createUpload('file:///tmp/gone.mov', 'gone.mov').send()).rejects.toThrow('File not found');
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it('rejects on a failing status', async () => {
		mockUpload.mockResolvedValue({ status: 413, body: '', headers: {} });
		await expect(createUpload('file:///cache/video.mp4', 'video.mp4').send()).rejects.toThrow('Error: 413');
	});

	it('aborts the signal handed to the native upload and rejects with Upload Cancelled after cancel()', async () => {
		const upload = createUpload('file:///cache/video.mp4', 'video.mp4');
		let nativeSignal: AbortSignal | undefined;
		mockUpload.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
			nativeSignal = options.signal;
			return new Promise((_resolve, reject) => {
				options.signal.addEventListener('abort', () => reject(new Error('AbortError')));
			});
		});
		const sending = upload.send();
		upload.cancel();
		await expect(sending).rejects.toThrow('Upload Cancelled');
		expect(nativeSignal?.aborted).toBe(true);
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
