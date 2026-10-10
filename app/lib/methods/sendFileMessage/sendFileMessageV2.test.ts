import { sendFileMessageV2 } from './sendFileMessageV2';
import { createUploadRecord, finalizeFailedUpload } from './utils';
import { uploadWithRetry } from './uploadWithRetry';

jest.mock('./utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn(),
	createUploadProgressCallback: jest.fn(),
	createUploadRecord: jest.fn(),
	finalizeFailedUpload: jest.fn()
}));
jest.mock('./uploadWithRetry', () => ({ uploadWithRetry: jest.fn() }));
jest.mock('../helpers/fileUpload', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/encryption', () => ({ Encryption: { encryptFile: jest.fn() } }));
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { write: (cb: () => Promise<unknown>) => cb() } }
}));

const fileInfo = { path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;

beforeEach(() => jest.clearAllMocks());

describe('sendFileMessageV2 - upload already in progress', () => {
	it('returns quietly instead of marking the still-active record as failed', async () => {
		(createUploadRecord as jest.Mock).mockResolvedValue([null, null]);

		await expect(
			sendFileMessageV2('GENERAL', fileInfo, undefined, 'https://open.rocket.chat', { id: 'u1', token: 't1' })
		).resolves.toBeUndefined();

		expect(finalizeFailedUpload).not.toHaveBeenCalled();
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});
});
