import { sendFileMessageV2 } from '../sendFileMessageV2';
import { uploadFileMessage } from '../uploadFileMessage';
import { copyFileToCacheDirectoryIfNeeded } from '../utils';
import { Encryption } from '~/lib/encryption';
import fetch from '../../helpers/fetch';

jest.mock('../uploadFileMessage', () => ({ uploadFileMessage: jest.fn() }));
jest.mock('../utils', () => ({ copyFileToCacheDirectoryIfNeeded: jest.fn() }));
jest.mock('../../helpers/fetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/encryption', () => ({ Encryption: { encryptFile: jest.fn() } }));

const RESPONSE = { file: { _id: 'file1', url: '/file/1' } } as any;

const confirmResponse = (status: number, body: string, retryAfter: string | null = null) => ({
	ok: status >= 200 && status < 300,
	status,
	headers: { get: (name: string) => (name === 'Retry-After' ? retryAfter : null) },
	text: () => Promise.resolve(body)
});

const prepare = async ({
	file = {},
	encryption = {},
	tmid
}: { file?: Record<string, unknown>; encryption?: Record<string, unknown>; tmid?: string } = {}) => {
	(Encryption.encryptFile as jest.Mock).mockResolvedValue({
		file: { path: '/tmp/pic.jpg', name: 'pic.jpg', type: 'image/jpeg', ...file },
		...encryption
	});
	await sendFileMessageV2('GENERAL', { path: '/tmp/pic.jpg', name: 'pic.jpg' } as any, tmid, 'https://open.rocket.chat', {
		id: 'u1',
		token: 't1'
	});
	return (uploadFileMessage as jest.Mock).mock.calls[0][0].prepare();
};

beforeEach(() => {
	jest.clearAllMocks();
	(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockResolvedValue('file:///cache/pic.jpg');
	(fetch as jest.Mock).mockResolvedValue(confirmResponse(200, '{"success":true}'));
});

describe('sendFileMessageV2', () => {
	it('uploads the cached copy of the file to rooms.media with the credentials of the user', async () => {
		const { url, headers, formData } = await prepare();

		expect(url).toBe('https://open.rocket.chat/api/v1/rooms.media/GENERAL');
		expect(headers).toMatchObject({ 'X-Auth-Token': 't1', 'X-User-Id': 'u1' });
		expect(formData).toEqual([{ name: 'file', type: 'image/jpeg', filename: 'pic.jpg', uri: 'file:///cache/pic.jpg' }]);
	});

	it('fails the upload when encryption throws before the upload starts', async () => {
		const encryptionError = new Error('Room encryption key is not available');
		(Encryption.encryptFile as jest.Mock).mockRejectedValue(encryptionError);
		await sendFileMessageV2('GENERAL', { path: '/tmp/pic.jpg', name: 'pic.jpg' } as any, undefined, 'https://open.rocket.chat', {
			id: 'u1',
			token: 't1'
		});

		await expect((uploadFileMessage as jest.Mock).mock.calls[0][0].prepare()).rejects.toBe(encryptionError);
	});

	it('sends the encrypted content next to the file', async () => {
		const { formData } = await prepare({ encryption: { fileContent: { key: 'k' } } });

		expect(formData[1]).toEqual({ name: 'content', data: JSON.stringify({ key: 'k' }) });
	});

	it('confirms the uploaded file with the message, thread and description', async () => {
		const { afterUpload } = await prepare({ file: { msg: 'hello', description: 'desc' }, tmid: 'thread1' });

		await afterUpload(RESPONSE);

		const [url, init] = (fetch as jest.Mock).mock.calls[0];
		expect(url).toBe('https://open.rocket.chat/api/v1/rooms.mediaConfirm/GENERAL/file1');
		expect(JSON.parse(init.body)).toEqual({ msg: 'hello', tmid: 'thread1', description: 'desc' });
	});

	it('keeps the message out of the confirmation of an encrypted file', async () => {
		const getContent = jest.fn().mockResolvedValue({ algorithm: 'rc.v2.aes-sha2' });
		const { afterUpload } = await prepare({ file: { msg: 'hello' }, encryption: { getContent } });

		await afterUpload(RESPONSE);

		expect(getContent).toHaveBeenCalledWith('file1', '/file/1');
		expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
			t: 'e2e',
			content: { algorithm: 'rc.v2.aes-sha2' }
		});
	});

	it('rejects a confirmation the server refused, carrying its status and message', async () => {
		(fetch as jest.Mock).mockResolvedValue(
			confirmResponse(429, '{"error":"You must wait 12 seconds before trying this endpoint again. [error-too-many-requests]"}')
		);
		const { afterUpload } = await prepare();

		await expect(afterUpload(RESPONSE)).rejects.toMatchObject({
			name: 'UploadHttpError',
			status: 429,
			serverMessage: expect.stringContaining('wait 12 seconds')
		});
	});

	it('rejects a confirmation a proxy rate limited, carrying the wait its Retry-After header asked for', async () => {
		(fetch as jest.Mock).mockResolvedValue(confirmResponse(429, 'Too Many Requests', '30'));
		const { afterUpload } = await prepare();

		await expect(afterUpload(RESPONSE)).rejects.toMatchObject({ status: 429, retryAfterSeconds: 30 });
	});
});
