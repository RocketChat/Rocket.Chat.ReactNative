import { uploadFileMessage } from '../uploadFileMessage';
import {
	cancelUpload,
	claimUploadSlot,
	createUploadProgressCallback,
	createUploadRecord,
	isUploadActive,
	recordUploadFailure,
	releaseUploadSlot,
	showUploadFailureToast
} from '../utils';
import FileUpload from '../../helpers/fileUpload';
import { UploadHttpError } from '../../helpers/fileUpload/UploadHttpError';

jest.mock('../utils', () => ({
	...jest.requireActual('../utils'),
	createUploadProgressCallback: jest.fn(),
	createUploadRecord: jest.fn(),
	recordUploadFailure: jest.fn(),
	showUploadFailureToast: jest.fn()
}));
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('~/i18n', () => ({ t: (k: string) => k }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('~/lib/database/services/Upload', () => ({ getUploadByPath: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({}));
jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: jest.fn() }));
jest.mock('../../helpers/fileUpload', () => ({ __esModule: true, default: jest.fn() }));

const UPLOAD_PATH = '/tmp/pic.jpg-GENERAL';
const RESPONSE = { file: { _id: 'file1', url: '/file/1' } };
const PREPARED = { url: 'https://open.rocket.chat/api/v1/rooms.media/GENERAL', headers: { 'X-Auth-Token': 't1' }, formData: [] };

const uploadSending = (send: jest.Mock) => (FileUpload as jest.Mock).mockImplementation(() => ({ send, cancel: jest.fn() }));

const arrange = () => {
	const record = { id: UPLOAD_PATH, db: { write: (cb: () => Promise<unknown>) => cb() }, destroyPermanently: jest.fn() };
	(createUploadRecord as jest.Mock).mockResolvedValue(record);
	return record;
};

const run = (prepared: { afterUpload?: (response: unknown) => Promise<void> } = {}, prepare?: () => Promise<unknown>) =>
	uploadFileMessage({
		rid: 'GENERAL',
		fileInfo: { path: '/tmp/pic.jpg' } as any,
		tmid: undefined,
		prepare: (prepare ?? (async () => ({ ...PREPARED, ...prepared }))) as any
	});

const isActive = () => isUploadActive('/tmp/pic.jpg', 'GENERAL');

beforeEach(async () => {
	await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');
	jest.clearAllMocks();
	jest.spyOn(Math, 'random').mockReturnValue(0.5);
	(createUploadProgressCallback as jest.Mock).mockReturnValue(jest.fn());
	uploadSending(jest.fn().mockResolvedValue(RESPONSE));
});

describe('uploadFileMessage', () => {
	it('rejects a send skipped because the same file is already uploading, without touching the running upload', async () => {
		const running = claimUploadSlot(UPLOAD_PATH);
		const prepare = jest.fn();

		await expect(run({}, prepare)).rejects.toThrow('Upload in progress');

		expect(createUploadRecord).not.toHaveBeenCalled();
		expect(prepare).not.toHaveBeenCalled();
		expect(isActive()).toBe(true);
		releaseUploadSlot(UPLOAD_PATH, running);
		expect(isActive()).toBe(false);
	});

	it('holds the slot while the sender is still preparing the upload', async () => {
		arrange();
		let activeWhilePreparing: boolean | undefined;

		await run({}, async () => {
			activeWhilePreparing = isActive();
			return PREPARED;
		});

		expect(activeWhilePreparing).toBe(true);
	});

	it('takes the slot before its first await, so a second Try again tap sees the upload as active', async () => {
		arrange();

		const sending = run();

		expect(isActive()).toBe(true);
		await sending;
	});

	it('uploads what the sender prepared, reporting progress on the upload record', async () => {
		arrange();
		const updateProgress = jest.fn();
		(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);

		await run();

		expect(FileUpload).toHaveBeenCalledWith(PREPARED.url, PREPARED.headers, PREPARED.formData, updateProgress);
	});

	it('destroys the record and frees the slot once the upload finished', async () => {
		const record = arrange();

		await run();

		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		expect(isActive()).toBe(false);
		expect(recordUploadFailure).not.toHaveBeenCalled();
	});

	it('hands the upload response to the step that runs after the upload', async () => {
		arrange();
		const afterUpload = jest.fn();

		await run({ afterUpload });

		expect(afterUpload).toHaveBeenCalledWith(RESPONSE);
	});

	it('keeps the slot and the record while the step after the upload is still running', async () => {
		const record = arrange();
		let activeDuringStep: boolean | undefined;
		let destroyedDuringStep = -1;
		const afterUpload = jest.fn(async () => {
			activeDuringStep = isActive();
			destroyedDuringStep = record.destroyPermanently.mock.calls.length;
		});

		await run({ afterUpload });

		expect(activeDuringStep).toBe(true);
		expect(destroyedDuringStep).toBe(0);
		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
	});

	it('records, announces and rethrows a failed upload, then frees the slot', async () => {
		const record = arrange();
		const error = new UploadHttpError(413);
		uploadSending(jest.fn().mockRejectedValue(error));

		await expect(run()).rejects.toBe(error);

		expect(recordUploadFailure).toHaveBeenCalledWith(record, error);
		expect(showUploadFailureToast).toHaveBeenCalledWith(error);
		expect(record.destroyPermanently).not.toHaveBeenCalled();
		expect(isActive()).toBe(false);
	});

	it('records a failure of the step after the upload instead of dropping the record', async () => {
		const record = arrange();
		const error = new Error('confirm failed');

		await expect(run({ afterUpload: jest.fn().mockRejectedValue(error) })).rejects.toBe(error);

		expect(recordUploadFailure).toHaveBeenCalledWith(record, error);
		expect(record.destroyPermanently).not.toHaveBeenCalled();
	});

	it('records a failure before the upload started', async () => {
		const record = arrange();
		const error = new Error('copy failed');

		await expect(run({}, () => Promise.reject(error))).rejects.toBe(error);

		expect(recordUploadFailure).toHaveBeenCalledWith(record, error);
		expect(FileUpload).not.toHaveBeenCalled();
	});

	it('frees the slot when the upload record cannot be created', async () => {
		const error = new Error('db write failed');
		(createUploadRecord as jest.Mock).mockRejectedValue(error);

		await expect(run()).rejects.toBe(error);

		expect(isActive()).toBe(false);
	});

	it('settles quietly when the upload is cancelled while its record is being reset', async () => {
		let failReset!: (error: Error) => void;
		(createUploadRecord as jest.Mock).mockImplementation(() => new Promise((_, reject) => (failReset = reject)));
		const pending = run();

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');
		failReset(new Error('record destroyed'));

		await expect(pending).resolves.toBeUndefined();
		expect(isActive()).toBe(false);
	});

	it('never uploads a file cancelled while it was being prepared', async () => {
		arrange();
		let finishPreparing!: () => void;
		const pending = run({}, () => new Promise(resolve => (finishPreparing = () => resolve(PREPARED))));
		await Promise.resolve();

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');
		finishPreparing();

		await expect(pending).resolves.toBeUndefined();
		expect(FileUpload).not.toHaveBeenCalled();
		expect(recordUploadFailure).not.toHaveBeenCalled();
	});

	it('settles quietly when the upload is cancelled while it runs', async () => {
		arrange();
		let rejectSend!: (error: Error) => void;
		const send = jest.fn(() => new Promise((_, reject) => (rejectSend = reject)));
		(FileUpload as jest.Mock).mockImplementation(() => ({
			send,
			cancel: () => rejectSend(new Error('Upload Cancelled'))
		}));
		const pending = run();
		await Promise.resolve();
		await Promise.resolve();

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');

		await expect(pending).resolves.toBeUndefined();
		expect(recordUploadFailure).not.toHaveBeenCalled();
		expect(showUploadFailureToast).not.toHaveBeenCalled();
	});

	describe('when the server rate limits', () => {
		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it('resets the progress while it waits to upload again', async () => {
			arrange();
			const updateProgress = jest.fn();
			(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);
			uploadSending(jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(RESPONSE));

			const pending = run();
			await jest.advanceTimersByTimeAsync(2000);
			await pending;

			expect(updateProgress).toHaveBeenCalledWith(0, 1);
			expect(FileUpload).toHaveBeenCalledTimes(2);
		});

		it('retries the step after the upload without uploading the file again', async () => {
			const record = arrange();
			const afterUpload = jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(undefined);

			const pending = run({ afterUpload });
			await jest.advanceTimersByTimeAsync(2000);
			await pending;

			expect(afterUpload).toHaveBeenCalledTimes(2);
			expect(FileUpload).toHaveBeenCalledTimes(1);
			expect(recordUploadFailure).not.toHaveBeenCalled();
			expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		});

		it('resets the progress while it waits to retry the step after the upload', async () => {
			arrange();
			const updateProgress = jest.fn();
			(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);
			const afterUpload = jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(undefined);

			const pending = run({ afterUpload });
			await jest.advanceTimersByTimeAsync(2000);
			await pending;

			expect(updateProgress).toHaveBeenCalledWith(0, 1);
		});
	});
});
