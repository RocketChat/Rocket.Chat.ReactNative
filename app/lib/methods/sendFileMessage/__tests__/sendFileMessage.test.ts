import { sendFileMessage } from '../sendFileMessage';
import { uploadFileMessage } from '../uploadFileMessage';
import { copyFileToCacheDirectoryIfNeeded } from '../utils';

jest.mock('../uploadFileMessage', () => ({ uploadFileMessage: jest.fn() }));
jest.mock('../utils', () => ({ copyFileToCacheDirectoryIfNeeded: jest.fn() }));

const send = async (fileInfo: Record<string, unknown> = {}, tmid?: string) => {
	const info = { path: '/tmp/pic.jpg', name: 'pic.jpg', type: 'image/jpeg', ...fileInfo } as any;
	let ridWhenUploadStarted: string | undefined;
	(uploadFileMessage as jest.Mock).mockImplementationOnce(async ({ fileInfo: sent }) => {
		ridWhenUploadStarted = sent.rid;
	});
	await sendFileMessage('GENERAL', info, tmid, 'https://open.rocket.chat', { id: 'u1', token: 't1' });
	const args = (uploadFileMessage as jest.Mock).mock.calls[0][0];
	const { url, headers, formData } = await args.prepare();
	return { info, args, url, headers, formData, ridWhenUploadStarted };
};

beforeEach(() => {
	jest.clearAllMocks();
	(copyFileToCacheDirectoryIfNeeded as jest.Mock).mockResolvedValue('file:///cache/pic.jpg');
});

describe('sendFileMessage', () => {
	it('records the room on the file info before the upload record is created from it', async () => {
		const { args, ridWhenUploadStarted } = await send();

		expect(args).toMatchObject({ rid: 'GENERAL', tmid: undefined });
		expect(ridWhenUploadStarted).toBe('GENERAL');
	});

	it('uploads the cached copy of the file with the credentials of the user', async () => {
		const { url, headers, formData } = await send();

		expect(url).toBe('https://open.rocket.chat/api/v1/rooms.upload/GENERAL');
		expect(headers).toMatchObject({ 'X-Auth-Token': 't1', 'X-User-Id': 'u1' });
		expect(formData).toEqual([{ name: 'file', type: 'image/jpeg', filename: 'pic.jpg', uri: 'file:///cache/pic.jpg' }]);
	});

	it('names an unnamed file', async () => {
		const { formData } = await send({ name: undefined });

		expect(formData[0].filename).toBe('fileMessage');
	});

	it('sends the description, message and thread only when there are any', async () => {
		const { formData } = await send({ description: 'desc', msg: 'hello' }, 'thread1');

		expect(formData.slice(1)).toEqual([
			{ name: 'description', data: 'desc' },
			{ name: 'msg', data: 'hello' },
			{ name: 'tmid', data: 'thread1' }
		]);
	});
});
