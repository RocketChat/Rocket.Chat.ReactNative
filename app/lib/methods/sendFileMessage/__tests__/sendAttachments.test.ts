import { sendAttachments } from '../sendAttachments';
import { sendFileMessage } from '../index';
import { sendFileMessage as sendFileMessageV1 } from '../sendFileMessage';
import { sendFileMessageV2 } from '../sendFileMessageV2';
import { type IShareAttachment } from '~/definitions';
import { Encryption } from '~/lib/encryption';
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

jest.mock('../index', () => ({ sendFileMessage: jest.fn(() => Promise.resolve()) }));
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

const UPLOAD_PATH = '/tmp/pic.jpg-GENERAL';

const firstAttempt = () => (FileUpload as jest.Mock).mock.instances[0];

beforeEach(() => jest.clearAllMocks());

const base = {
	rid: 'rid1',
	tmid: undefined,
	server: 'https://open.rocket.chat',
	user: { id: 'u1', token: 't1' },
	getMsg: jest.fn((_a: IShareAttachment, i: number) => `msg-${i}`)
} as any;

const attachment = (extra?: Partial<IShareAttachment>): IShareAttachment =>
	({
		filename: 'a.jpg',
		mime: 'image/jpeg',
		description: 'desc',
		altText: 'alt',
		size: 10,
		path: '/tmp/a.jpg',
		canUpload: true,
		width: 100,
		height: 200,
		...extra
	}) as IShareAttachment;

describe('sendAttachments', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		base.getMsg.mockImplementation((_: unknown, i: number) => `msg-${i}`);
	});

	it('maps each IShareAttachment to a sendFileMessage call', async () => {
		await sendAttachments({ ...base, attachments: [attachment(), attachment({ filename: 'b.jpg', path: '/tmp/b.jpg' })] });
		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('skips attachments where not canUpload', async () => {
		await sendAttachments({ ...base, attachments: [attachment({ canUpload: false }), attachment()] });
		expect(sendFileMessage).toHaveBeenCalledTimes(1);
	});

	it('reports a synchronous throw from sendFileMessage as that attachment rejected', async () => {
		const error = new Error('sync failure');
		(sendFileMessage as jest.Mock).mockImplementationOnce(() => {
			throw error;
		});

		const results = await sendAttachments({
			...base,
			attachments: [attachment(), attachment({ filename: 'b.jpg', path: '/tmp/b.jpg' })]
		});

		expect(results).toEqual([
			{ status: 'rejected', reason: error },
			{ status: 'fulfilled', value: undefined }
		]);
	});

	it.each([['5'], ['6'], ['7'], ['8']])('swaps width/height for rotated EXIF orientation %s', async orientation => {
		await sendAttachments({ ...base, attachments: [attachment({ exif: { Orientation: orientation } })] });
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ width: 200, height: 100 }),
			undefined,
			base.server,
			base.user
		);
	});

	it('keeps width/height as-is for non-rotated orientations', async () => {
		await sendAttachments({ ...base, attachments: [attachment({ exif: { Orientation: '1' } })] });
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ width: 100, height: 200 }),
			undefined,
			base.server,
			base.user
		);
	});

	it('picks altText when altTextSupported, else description', async () => {
		await sendAttachments({ ...base, altTextSupported: true, attachments: [attachment()] });
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ description: 'alt' }),
			undefined,
			base.server,
			base.user
		);
		jest.clearAllMocks();
		await sendAttachments({ ...base, altTextSupported: false, attachments: [attachment()] });
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ description: 'desc' }),
			undefined,
			base.server,
			base.user
		);
	});

	it('derives msg from the injected getMsg callback', async () => {
		base.getMsg.mockReturnValueOnce('hello');
		await sendAttachments({ ...base, altTextSupported: false, attachments: [attachment()] });
		expect(base.getMsg).toHaveBeenCalledWith(expect.objectContaining({ filename: 'a.jpg' }), 0);
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ msg: 'hello' }),
			undefined,
			base.server,
			base.user
		);
	});

	it('closes an unclosed code block in the msg before sending', async () => {
		base.getMsg.mockReturnValueOnce('```js\nconst a = 1;');
		await sendAttachments({ ...base, altTextSupported: false, attachments: [attachment()] });
		expect(sendFileMessage).toHaveBeenCalledWith(
			'rid1',
			expect.objectContaining({ msg: '```js\nconst a = 1;\n```' }),
			undefined,
			base.server,
			base.user
		);
	});

	it('reports each upload outcome in attachment order instead of rejecting on the first failure', async () => {
		const failure = new Error('upload failed');
		(sendFileMessage as jest.Mock).mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);

		const results = await sendAttachments({ ...base, attachments: [attachment(), attachment({ path: '/tmp/b.jpg' })] });

		expect(results).toEqual([
			{ status: 'rejected', reason: failure },
			{ status: 'fulfilled', value: undefined }
		]);
	});

	it('does not settle while another upload is still running', async () => {
		let finishSecond!: () => void;
		(sendFileMessage as jest.Mock)
			.mockRejectedValueOnce(new Error('upload failed'))
			.mockImplementationOnce(() => new Promise<void>(resolve => (finishSecond = resolve)));

		const pending = sendAttachments({ ...base, attachments: [attachment(), attachment({ path: '/tmp/b.jpg' })] });
		const outcome = await Promise.race([
			pending.then(() => 'settled'),
			new Promise(resolve => setTimeout(() => resolve('still pending'), 0))
		]);
		finishSecond();

		expect(outcome).toBe('still pending');
		await expect(pending).resolves.toHaveLength(2);
	});

	it('reports an attachment as sent as soon as its own upload is done, while another is still running', async () => {
		let finishSecond!: () => void;
		(sendFileMessage as jest.Mock)
			.mockResolvedValueOnce(undefined)
			.mockImplementationOnce(() => new Promise<void>(resolve => (finishSecond = resolve)));
		const onSent = jest.fn();
		const first = attachment();
		const second = attachment({ path: '/tmp/b.jpg' });

		const pending = sendAttachments({ ...base, attachments: [first, second], onSent });
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(onSent).toHaveBeenCalledTimes(1);
		expect(onSent).toHaveBeenCalledWith(first);

		finishSecond();
		await pending;

		expect(onSent).toHaveBeenCalledTimes(2);
		expect(onSent).toHaveBeenLastCalledWith(second);
	});

	it('does not report a skipped or a failed attachment as sent', async () => {
		(sendFileMessage as jest.Mock).mockRejectedValueOnce(new Error('upload failed'));
		const onSent = jest.fn();

		await sendAttachments({
			...base,
			attachments: [attachment({ canUpload: false }), attachment({ path: '/tmp/b.jpg' })],
			onSent
		});

		expect(onSent).not.toHaveBeenCalled();
	});
});

describe('sendFileMessage', () => {
	const send = () =>
		sendFileMessageV1(
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

	it('reports a send skipped because the upload is already in progress as a failure under no upload key', async () => {
		(createUploadRecord as jest.Mock).mockResolvedValue([null, null]);

		await send();

		expect(finalizeFailedUpload).toHaveBeenCalledWith({ uploadPath: '', error: expect.any(Error), upload: null });
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});

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
		expect(args).toMatchObject({ uploadPath: UPLOAD_PATH, error });
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
		expect(args).toMatchObject({ uploadPath: UPLOAD_PATH, error, upload: null });
		expect(uploadWithRetry).not.toHaveBeenCalled();
	});
});

describe('sendFileMessageV2', () => {
	const fileInfo = { path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;

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

	describe('upload already in progress', () => {
		it('reports the skipped send as a failure under no upload key so the active record is left alone', async () => {
			(createUploadRecord as jest.Mock).mockResolvedValue([null, null]);

			await send();

			expect(finalizeFailedUpload).toHaveBeenCalledWith({ uploadPath: '', error: expect.any(Error), upload: null });
			expect(uploadWithRetry).not.toHaveBeenCalled();
		});
	});

	describe('upload outcome', () => {
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
			expect(args).toMatchObject({ uploadPath: UPLOAD_PATH, error });
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
			expect(args).toMatchObject({ uploadPath: UPLOAD_PATH, error, upload: null });
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
});
