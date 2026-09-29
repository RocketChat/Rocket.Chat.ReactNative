import { sendFileMessage } from './index';
import { store } from '~/lib/store/auxStore';
import { sendFileMessage as sendFileMessageV1 } from './sendFileMessage';
import { sendFileMessageV2 } from './sendFileMessageV2';

jest.mock('~/lib/store/auxStore', () => ({ store: { getState: jest.fn() } }));
jest.mock('./sendFileMessage', () => ({ sendFileMessage: jest.fn() }));
jest.mock('./sendFileMessageV2', () => ({ sendFileMessageV2: jest.fn() }));

const args: Parameters<typeof sendFileMessage> = [
	'rid1',
	{ name: 'a.jpg' } as any,
	undefined,
	'https://open.rocket.chat',
	{ id: 'u1', token: 't1' },
	undefined
];

describe('sendFileMessage selector', () => {
	beforeEach(() => jest.clearAllMocks());

	it('server < 6.10.0 dispatches sendFileMessageV1, forwarding all args', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.9.0' } });
		(sendFileMessageV1 as jest.Mock).mockResolvedValue(undefined);
		const fullArgs: Parameters<typeof sendFileMessage> = [...args];
		fullArgs[5] = true;

		await expect(sendFileMessage(...fullArgs)).resolves.toBeUndefined();
		expect(sendFileMessageV1).toHaveBeenCalledWith(...fullArgs);
		expect(sendFileMessageV2).not.toHaveBeenCalled();
	});

	it('server >= 6.10.0 dispatches sendFileMessageV2, forwarding all args', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.11.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue(undefined);

		await expect(sendFileMessage(...args)).resolves.toBeUndefined();
		expect(sendFileMessageV2).toHaveBeenCalledWith(...args);
		expect(sendFileMessageV1).not.toHaveBeenCalled();
	});

	it('decodes a percent-encoded name before dispatching to V2 without mutating the caller object', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.11.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue(undefined);
		const fileInfo = { name: '%D0%A4%D0%B0%D0%B9%D0%BB.pdf' } as any;

		await sendFileMessage('rid1', fileInfo, undefined, args[3], args[4], undefined);

		expect(sendFileMessageV2).toHaveBeenCalledWith(
			'rid1',
			{ name: 'Файл.pdf' },
			undefined,
			args[3],
			args[4],
			undefined
		);
		expect(fileInfo.name).toBe('%D0%A4%D0%B0%D0%B9%D0%BB.pdf');
	});

	it('decodes a percent-encoded name before dispatching to V1', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.9.0' } });
		(sendFileMessageV1 as jest.Mock).mockResolvedValue(undefined);

		await sendFileMessage('rid1', { name: '%D0%A4%D0%B0%D0%B9%D0%BB.pdf' } as any, undefined, args[3], args[4], undefined);

		expect(sendFileMessageV1).toHaveBeenCalledWith(
			'rid1',
			{ name: 'Файл.pdf' },
			undefined,
			args[3],
			args[4],
			undefined
		);
	});

	it('forwards the same fileInfo object when the name is undefined or already plain', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.11.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue(undefined);
		const noName = {} as any;

		await sendFileMessage('rid1', noName, undefined, args[3], args[4], undefined);
		await sendFileMessage('rid1', args[1], undefined, args[3], args[4], undefined);

		expect((sendFileMessageV2 as jest.Mock).mock.calls[0][1]).toBe(noName);
		expect((sendFileMessageV2 as jest.Mock).mock.calls[1][1]).toBe(args[1]);
	});

	it('server exactly 6.10.0 takes the v2 branch (boundary, lowerThan is strict)', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.10.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue(undefined);

		await expect(sendFileMessage(...args)).resolves.toBeUndefined();
		expect(sendFileMessageV2).toHaveBeenCalledWith(...args);
		expect(sendFileMessageV1).not.toHaveBeenCalled();
	});
});
