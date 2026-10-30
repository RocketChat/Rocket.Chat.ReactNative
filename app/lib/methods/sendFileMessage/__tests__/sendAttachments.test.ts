import { sendAttachments } from '../sendAttachments';
import { sendFileMessage } from '../index';
import { type IShareAttachment } from '~/definitions';

jest.mock('../index', () => ({ sendFileMessage: jest.fn(() => Promise.resolve()) }));

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
});
