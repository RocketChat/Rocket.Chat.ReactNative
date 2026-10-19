import { sendFileMessage } from '../sendFileMessage';
import FileUpload from '../../helpers/fileUpload';
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
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { write: (cb: () => Promise<unknown>) => cb() } }
}));

const UPLOAD_PATH = '/tmp/pic.jpg-GENERAL';

const send = () =>
	sendFileMessage(
		'GENERAL',
		{ path: '/tmp/pic.jpg', name: 'pic.jpg', type: 'image/jpeg' } as any,
		undefined,
		'https://open.rocket.chat',
		{ id: 'u1', token: 't1' }
	);

const arrange = () => {
	const record = { destroyPermanently: jest.fn() };
	(createUploadRecord as jest.Mock).mockResolvedValue([UPLOAD_PATH, record]);
	(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockResolvedValue('file:///cache/pic.jpg');
	return record;
};

const startAttempt = async (_path: string, createUpload: () => unknown) => createUpload();

const firstAttempt = () => (FileUpload as jest.Mock).mock.instances[0];

beforeEach(() => jest.clearAllMocks());

describe('sendFileMessage', () => {
	it('destroys the record and frees the slot once the upload finished', async () => {
		const record = arrange();
		(uploadWithRetry as jest.Mock).mockImplementation(startAttempt);

		await send();

		expect(record.destroyPermanently).toHaveBeenCalledTimes(1);
		const [key, released] = (releaseUploadSlot as jest.Mock).mock.calls[0];
		expect(key).toBe(UPLOAD_PATH);
		expect(released).toBe(firstAttempt());
		expect(finalizeFailedUpload).not.toHaveBeenCalled();
	});

	it('reports a failure under the upload key and for the attempt that failed', async () => {
		arrange();
		const error = new Error('boom');
		(uploadWithRetry as jest.Mock).mockImplementation(async (path: string, createUpload: () => unknown) => {
			await startAttempt(path, createUpload);
			throw error;
		});

		await send();

		const [args] = (finalizeFailedUpload as jest.Mock).mock.calls[0];
		expect(args).toMatchObject({ queueKey: UPLOAD_PATH, error });
		expect(args.upload).toBe(firstAttempt());
		expect(releaseUploadSlot).not.toHaveBeenCalled();
	});

	it('lets the retry loop reset the progress its attempts reported', async () => {
		arrange();
		const updateProgress = jest.fn();
		(createUploadProgressCallback as jest.Mock).mockReturnValueOnce(updateProgress);
		(uploadWithRetry as jest.Mock).mockImplementation(
			async (_path: string, _createUpload: () => unknown, onRetryWait: () => Promise<void>) => onRetryWait()
		);

		await send();

		expect(updateProgress).toHaveBeenCalledWith(0, 1);
	});

	it('reports a failure before any attempt started without an attempt to blame', async () => {
		arrange();
		const error = new Error('copy failed');
		(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockRejectedValue(error);

		await send();

		const [args] = (finalizeFailedUpload as jest.Mock).mock.calls[0];
		expect(args).toMatchObject({ queueKey: UPLOAD_PATH, error, upload: null });
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});
});
