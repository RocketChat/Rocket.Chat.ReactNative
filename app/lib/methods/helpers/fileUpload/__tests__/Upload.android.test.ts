import * as FileSystem from 'expo-file-system/legacy';

import { Upload } from '../Upload.android';

jest.mock('expo-file-system/legacy', () => ({
	createUploadTask: jest.fn(),
	FileSystemUploadType: { MULTIPART: 'MULTIPART' }
}));

const mockUpload = (response: { status: number; body?: string; headers?: Record<string, string> } | undefined) => {
	const cancelAsync = jest.fn();
	(FileSystem.createUploadTask as jest.Mock).mockReturnValue({
		uploadAsync: jest.fn(() => Promise.resolve(response)),
		cancelAsync
	});
	return cancelAsync;
};

const send = () => {
	const upload = new Upload();
	upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
	upload.appendFile({ name: 'file', uri: 'file://image.jpg', type: 'image/jpeg', filename: 'image.jpg' });
	return upload.send();
};

beforeEach(() => jest.clearAllMocks());

describe('Upload (android)', () => {
	it('resolves the parsed body on success', async () => {
		mockUpload({ status: 200, body: '{"file":{"_id":"abc"}}' });

		await expect(send()).resolves.toEqual({ file: { _id: 'abc' } });
	});

	it('rejects a 413 with the status and the server message', async () => {
		mockUpload({ status: 413, body: '{"error":"File is too large"}' });

		await expect(send()).rejects.toMatchObject({
			name: 'UploadHttpError',
			status: 413,
			serverMessage: 'File is too large'
		});
	});

	it('carries Retry-After from the response headers', async () => {
		mockUpload({ status: 429, body: '{}', headers: { 'Retry-After': '12' } });

		await expect(send()).rejects.toMatchObject({ status: 429, retryAfterSeconds: 12 });
	});

	it('rejects with a plain error instead of a bogus status when there is no response', async () => {
		mockUpload(undefined);

		const error = await send().catch(e => e);

		expect(error).toBeInstanceOf(Error);
		expect(error).not.toHaveProperty('status');
		expect(error.message).toBe('Upload failed: no response');
	});

	it('rejects with a cancellation when the native upload fails after cancel()', async () => {
		let failNativeUpload: (error: Error) => void = () => {};
		const cancelAsync = jest.fn();
		(FileSystem.createUploadTask as jest.Mock).mockReturnValue({
			uploadAsync: jest.fn(() => new Promise((_resolve, reject) => (failNativeUpload = reject))),
			cancelAsync
		});
		const upload = new Upload();
		upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});
		upload.appendFile({ name: 'file', uri: 'file://image.jpg', type: 'image/jpeg', filename: 'image.jpg' });

		const pending = upload.send();
		upload.cancel();
		failNativeUpload(new Error('native upload aborted'));

		await expect(pending).rejects.toThrow('Upload cancelled');
		expect(cancelAsync).toHaveBeenCalledTimes(1);
	});

	it('rethrows the native error when the upload was not cancelled', async () => {
		(FileSystem.createUploadTask as jest.Mock).mockReturnValue({
			uploadAsync: jest.fn(() => Promise.reject(new Error('native failure'))),
			cancelAsync: jest.fn()
		});

		await expect(send()).rejects.toThrow('native failure');
	});

	it('rejects with a clear error when no file was appended', async () => {
		const upload = new Upload();
		upload.setupRequest('https://open.rocket.chat/api/v1/rooms.media/rid', {});

		await expect(upload.send()).rejects.toThrow('No file to upload');
	});
});
