import { Encryption } from '~/lib/encryption';
import { sendFileMessageV2 } from '../sendFileMessageV2';
import FileUpload from '../../helpers/fileUpload';
import fetch from '../../helpers/fetch';
import {
	copyFileToCacheDirectoryIfNeeded,
	createUploadProgressCallback,
	createUploadRecord,
	finalizeFailedUpload,
	releaseUploadSlot
} from '../utils';
import { uploadWithRetry } from '../uploadWithRetry';

jest.mock('../utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn(),
	createUploadProgressCallback: jest.fn(),
	createUploadRecord: jest.fn(),
	finalizeFailedUpload: jest.fn(),
	releaseUploadSlot: jest.fn()
}));
jest.mock('../uploadWithRetry', () => ({ uploadWithRetry: jest.fn() }));
jest.mock('../../helpers/fileUpload', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/encryption', () => ({ Encryption: { encryptFile: jest.fn() } }));
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { write: (cb: () => Promise<unknown>) => cb() } }
}));

const fileInfo = { path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;
const UPLOAD_PATH = '/tmp/pic.jpg-GENERAL';

const send = () =>
	sendFileMessageV2('GENERAL', { ...fileInfo }, undefined, 'https://open.rocket.chat', { id: 'u1', token: 't1' });

const arrange = () => {
	const record = { destroyPermanently: jest.fn() };
	(createUploadRecord as jest.Mock).mockResolvedValue([UPLOAD_PATH, record]);
	(Encryption.encryptFile as jest.Mock).mockImplementation(async (_rid: string, info: unknown) => ({ file: info }));
	(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockResolvedValue('file:///cache/pic.jpg');
	(fetch as jest.Mock).mockResolvedValue({ ok: true });
	return record;
};

const startAttempt = async (_path: string, createUpload: () => unknown) => {
	createUpload();
	return { file: { _id: 'file1', url: '/file/1' } };
};

const firstAttempt = () => (FileUpload as jest.Mock).mock.instances[0];

beforeEach(() => jest.clearAllMocks());

describe('sendFileMessageV2 - upload already in progress', () => {
	it('returns quietly instead of marking the still-active record as failed', async () => {
		(createUploadRecord as jest.Mock).mockResolvedValue([null, null]);

		await expect(send()).resolves.toBeUndefined();

		expect(finalizeFailedUpload).not.toHaveBeenCalled();
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});
});

describe('sendFileMessageV2 - upload outcome', () => {
	it('destroys the record and frees the slot once the message is confirmed', async () => {
		const record = arrange();
		(uploadWithRetry as jest.Mock).mockImplementation(startAttempt);

		await send();

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		const [key, released] = (releaseUploadSlot as jest.Mock).mock.calls[0];
		expect(key).toBe(UPLOAD_PATH);
		expect(released).toBe(firstAttempt());
		expect(finalizeFailedUpload).not.toHaveBeenCalled();
	});

	it('keeps the slot while the message is still being confirmed', async () => {
		const record = arrange();
		(uploadWithRetry as jest.Mock).mockImplementation(startAttempt);
		(fetch as jest.Mock).mockImplementation(() => {
			expect(releaseUploadSlot).not.toHaveBeenCalled();
			expect(record.destroyPermanently).not.toHaveBeenCalled();
			return Promise.resolve({ ok: true });
		});

		await send();

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(releaseUploadSlot).toHaveBeenCalledTimes(1);
	});

	it('reports a failure under the upload key and for the attempt that failed', async () => {
		arrange();
		const error = new Error('boom');
		(uploadWithRetry as jest.Mock).mockImplementation(async (path: string, createUpload: () => unknown) => {
			await startAttempt(path, createUpload);
			throw error;
		});
		jest.spyOn(console, 'error').mockImplementation(() => {});

		await send();

		const [args] = (finalizeFailedUpload as jest.Mock).mock.calls[0];
		expect(args).toMatchObject({ queueKey: UPLOAD_PATH, error });
		expect(args.upload).toBe(firstAttempt());
		expect(releaseUploadSlot).not.toHaveBeenCalled();
	});

	it('reports a failure before any attempt started without an attempt to blame', async () => {
		arrange();
		const error = new Error('encryption failed');
		(Encryption.encryptFile as jest.Mock).mockRejectedValue(error);
		jest.spyOn(console, 'error').mockImplementation(() => {});

		await send();

		const [args] = (finalizeFailedUpload as jest.Mock).mock.calls[0];
		expect(args).toMatchObject({ queueKey: UPLOAD_PATH, error, upload: null });
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});

	it('lets the retry loop reset the progress its attempts reported', async () => {
		arrange();
		const updateProgress = jest.fn();
		(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);
		(uploadWithRetry as jest.Mock).mockImplementation(
			async (_path: string, createUpload: () => unknown, onRetryWait: () => Promise<void>) => {
				createUpload();
				await onRetryWait();
				return { file: { _id: 'file1', url: '/file/1' } };
			}
		);

		await send();

		expect(updateProgress).toHaveBeenCalledWith(0, 1);
	});

	it('reports a confirm the server rejected instead of dropping the record', async () => {
		const record = arrange();
		(uploadWithRetry as jest.Mock).mockImplementation(startAttempt);
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 429,
			text: () =>
				Promise.resolve('{"error":"You must wait 12 seconds before trying this endpoint again. [error-too-many-requests]"}')
		});
		jest.spyOn(console, 'error').mockImplementation(() => {});

		await send();

		const [args] = (finalizeFailedUpload as jest.Mock).mock.calls[0];
		expect(args.error).toMatchObject({
			name: 'UploadHttpError',
			status: 429,
			serverMessage: expect.stringContaining('wait 12 seconds')
		});
		expect(args.upload).toBe(firstAttempt());
		expect(record.destroyPermanently).not.toHaveBeenCalled();
		expect(releaseUploadSlot).not.toHaveBeenCalled();
	});
});
