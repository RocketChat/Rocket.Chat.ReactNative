import { Encryption } from '~/lib/encryption';
import { sendFileMessageV2 } from '../sendFileMessageV2';
import { createUploadRecord, persistUploadError } from '../utils';

jest.mock('~/lib/database', () => ({ __esModule: true, default: { active: {} } }));
jest.mock('~/lib/encryption', () => ({ Encryption: { encryptFile: jest.fn() } }));
jest.mock('../utils', () => ({
	uploadQueue: {},
	createUploadRecord: jest.fn(),
	persistUploadError: jest.fn(),
	copyFileToCacheDirectoryIfNeeded: jest.fn()
}));

const fileInfo = { rid: 'room-id', path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;

describe('sendFileMessageV2', () => {
	it('marks the upload as failed when encryption throws before the upload starts', async () => {
		const encryptionError = new Error('Room encryption key is not available');
		(createUploadRecord as jest.Mock).mockResolvedValue(['/tmp/pic.jpg-room-id', {}]);
		(Encryption.encryptFile as jest.Mock).mockRejectedValue(encryptionError);
		jest.spyOn(console, 'error').mockImplementation(() => {});

		await expect(
			sendFileMessageV2('room-id', fileInfo, undefined, 'https://server', { id: 'user-id', token: 'token' })
		).rejects.toBe(encryptionError);
		expect(persistUploadError).toHaveBeenCalledWith('/tmp/pic.jpg', 'room-id');
	});
});
