import { uploadFileMessage } from '../uploadFileMessage';
import { createUploadProgressCallback, createUploadRecord, finalizeFailedUpload, releaseUploadSlot } from '../utils';
import { uploadWithRetry } from '../uploadWithRetry';
import FileUpload from '../../helpers/fileUpload';
import { UploadHttpError } from '../../helpers/fileUpload/UploadHttpError';

jest.mock('../utils', () => ({
	createUploadProgressCallback: jest.fn(),
	createUploadRecord: jest.fn(),
	finalizeFailedUpload: jest.fn(),
	releaseUploadSlot: jest.fn(),
	ownsUploadSlot: jest.fn(() => true),
	uploadRetryWaits: {}
}));
jest.mock('../uploadWithRetry', () => ({ ...jest.requireActual('../uploadWithRetry'), uploadWithRetry: jest.fn() }));
jest.mock('../../helpers/fileUpload', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { write: (cb: () => Promise<unknown>) => cb() } }
}));

const UPLOAD_PATH = '/tmp/pic.jpg-GENERAL';
const RESPONSE = { file: { _id: 'file1', url: '/file/1' } };
const PREPARED = { url: 'https://open.rocket.chat/api/v1/rooms.media/GENERAL', headers: { 'X-Auth-Token': 't1' }, formData: [] };

const firstAttempt = () => (FileUpload as jest.Mock).mock.instances[0];

beforeEach(() => {
	jest.clearAllMocks();
	(uploadWithRetry as jest.Mock).mockImplementation(async (_path: string, createUpload: () => unknown) => {
		createUpload();
		return RESPONSE;
	});
});

const arrange = () => {
	const record = { id: UPLOAD_PATH, destroyPermanently: jest.fn() };
	(createUploadRecord as jest.Mock).mockResolvedValue(record);
	return record;
};

const run = (prepared: { afterUpload?: (response: unknown) => Promise<void> } = {}) => {
	const prepare = jest.fn(async () => ({ ...PREPARED, ...prepared }));
	const result = uploadFileMessage({
		rid: 'GENERAL',
		fileInfo: { path: '/tmp/pic.jpg' } as any,
		tmid: undefined,
		prepare: prepare as any
	});
	return { result, prepare };
};

describe('uploadFileMessage', () => {
	it('rejects a send skipped because the upload is already in progress without touching the running upload', async () => {
		(createUploadRecord as jest.Mock).mockRejectedValue(new Error("Couldn't create upload record"));

		const { result, prepare } = run();

		await expect(result).rejects.toThrow("Couldn't create upload record");
		expect(finalizeFailedUpload).not.toHaveBeenCalled();
		expect(prepare).not.toHaveBeenCalled();
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});

	it('uploads what the sender prepared, reporting progress on the upload record', async () => {
		arrange();
		const updateProgress = jest.fn();
		(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);

		await run().result;

		expect(FileUpload).toHaveBeenCalledWith(PREPARED.url, PREPARED.headers, PREPARED.formData, updateProgress);
	});

	it('destroys the record and frees the slot once the upload finished', async () => {
		const record = arrange();

		await run().result;

		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		expect(releaseUploadSlot).toHaveBeenCalledWith(UPLOAD_PATH, firstAttempt());
		expect(finalizeFailedUpload).not.toHaveBeenCalled();
	});

	it('hands the upload response to the step that runs after the upload', async () => {
		arrange();
		const afterUpload = jest.fn();

		await run({ afterUpload }).result;

		expect(afterUpload).toHaveBeenCalledWith(RESPONSE);
	});

	it('keeps the slot and the record while the step after the upload is still running', async () => {
		const record = arrange();
		let released = -1;
		let destroyed = -1;
		const afterUpload = jest.fn(async () => {
			released = (releaseUploadSlot as jest.Mock).mock.calls.length;
			destroyed = record.destroyPermanently.mock.calls.length;
		});

		await run({ afterUpload }).result;

		expect(released).toBe(0);
		expect(destroyed).toBe(0);
		expect(releaseUploadSlot).toHaveBeenCalledTimes(1);
		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
	});

	it('reports a failure under the upload key and for the attempt that failed', async () => {
		arrange();
		const error = new Error('boom');
		(uploadWithRetry as jest.Mock).mockImplementation(async (_path: string, createUpload: () => unknown) => {
			createUpload();
			throw error;
		});

		await run().result;

		expect(finalizeFailedUpload).toHaveBeenCalledWith({ uploadPath: UPLOAD_PATH, error, upload: firstAttempt() });
		expect(releaseUploadSlot).not.toHaveBeenCalled();
	});

	it('reports a failure of the step after the upload instead of dropping the record', async () => {
		const record = arrange();
		const error = new Error('confirm failed');

		await run({ afterUpload: jest.fn().mockRejectedValue(error) }).result;

		expect(finalizeFailedUpload).toHaveBeenCalledWith({ uploadPath: UPLOAD_PATH, error, upload: firstAttempt() });
		expect(record.destroyPermanently).not.toHaveBeenCalled();
		expect(releaseUploadSlot).not.toHaveBeenCalled();
	});

	it('reports a failure before any attempt started without an attempt to blame', async () => {
		arrange();
		const error = new Error('copy failed');

		await uploadFileMessage({
			rid: 'GENERAL',
			fileInfo: { path: '/tmp/pic.jpg' } as any,
			tmid: undefined,
			prepare: () => Promise.reject(error)
		});

		expect(finalizeFailedUpload).toHaveBeenCalledWith({ uploadPath: UPLOAD_PATH, error, upload: null });
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});

	it('lets the retry loop reset the progress its attempts reported', async () => {
		arrange();
		const updateProgress = jest.fn();
		(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);
		(uploadWithRetry as jest.Mock).mockImplementation(
			async (_path: string, _createUpload: () => unknown, onRetryWait: () => Promise<void>) => {
				await onRetryWait();
				return RESPONSE;
			}
		);

		await run().result;

		expect(updateProgress).toHaveBeenCalledWith(0, 1);
	});

	describe('when the server rate limits the step after the upload', () => {
		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it('retries that step without uploading the file again', async () => {
			const record = arrange();
			const afterUpload = jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(undefined);

			const { result } = run({ afterUpload });
			await jest.advanceTimersByTimeAsync(2000);
			await result;

			expect(afterUpload).toHaveBeenCalledTimes(2);
			expect(uploadWithRetry).toHaveBeenCalledTimes(1);
			expect(finalizeFailedUpload).not.toHaveBeenCalled();
			expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		});
	});
});
