import { sendAttachments } from '../sendAttachments';
import { sendFileMessage } from '../index';
import { type IShareAttachment } from '~/definitions';
import log from '../../helpers/log';

jest.mock('../index', () => ({ sendFileMessage: jest.fn(() => Promise.resolve()) }));
jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const base = {
	rid: 'rid1',
	tmid: undefined,
	server: 'https://open.rocket.chat',
	user: { id: 'u1', token: 't1' },
	getMsg: jest.fn((a: IShareAttachment) => `msg-${a.filename}`)
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
		base.getMsg.mockImplementation((a: IShareAttachment) => `msg-${a.filename}`);
	});

	it('maps each IShareAttachment to a sendFileMessage call', async () => {
		await sendAttachments({ ...base, attachments: [attachment(), attachment({ filename: 'b.jpg', path: '/tmp/b.jpg' })] });
		expect(sendFileMessage).toHaveBeenCalledTimes(2);
	});

	it('skips attachments where not canUpload', async () => {
		await sendAttachments({ ...base, attachments: [attachment({ canUpload: false }), attachment()] });
		expect(sendFileMessage).toHaveBeenCalledTimes(1);
	});

	it('returns an attachment whose sendFileMessage threw synchronously as unsent', async () => {
		const failing = attachment();
		(sendFileMessage as jest.Mock).mockImplementationOnce(() => {
			throw new Error('sync failure');
		});

		const unsent = await sendAttachments({
			...base,
			attachments: [failing, attachment({ filename: 'b.jpg', path: '/tmp/b.jpg' })]
		});

		expect(unsent).toEqual([failing]);
	});

	it('returns the attachments it could not upload as unsent, even when every other upload succeeded', async () => {
		const skipped = attachment({ canUpload: false, path: '/tmp/skipped.jpg' });

		const unsent = await sendAttachments({ ...base, attachments: [attachment(), skipped] });

		expect(unsent).toEqual([skipped]);
	});

	it('returns nothing when every attachment was sent', async () => {
		await expect(sendAttachments({ ...base, attachments: [attachment(), attachment({ path: '/tmp/b.jpg' })] })).resolves.toEqual(
			[]
		);
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
		expect(base.getMsg).toHaveBeenCalledWith(expect.objectContaining({ filename: 'a.jpg' }));
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

	it('returns only the attachments that failed, and logs each failure, instead of rejecting on the first one', async () => {
		const failure = new Error('upload failed');
		const failing = attachment({ path: '/tmp/b.jpg' });
		(sendFileMessage as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure);

		const unsent = await sendAttachments({ ...base, attachments: [attachment(), failing] });

		expect(unsent).toEqual([failing]);
		expect(log).toHaveBeenCalledWith(failure);
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
		await expect(pending).resolves.toHaveLength(1);
	});
});
