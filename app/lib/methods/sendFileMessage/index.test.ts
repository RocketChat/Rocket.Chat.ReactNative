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
		(sendFileMessageV1 as jest.Mock).mockResolvedValue('v1');
		const fullArgs: Parameters<typeof sendFileMessage> = [...args.slice(0, 5), true] as any;

		await expect(sendFileMessage(...fullArgs)).resolves.toBe('v1');
		expect(sendFileMessageV1).toHaveBeenCalledWith(...fullArgs);
		expect(sendFileMessageV2).not.toHaveBeenCalled();
	});

	it('server >= 6.10.0 dispatches sendFileMessageV2, forwarding all args', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.11.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue('v2');

		await expect(sendFileMessage(...args)).resolves.toBe('v2');
		expect(sendFileMessageV2).toHaveBeenCalledWith(...args);
		expect(sendFileMessageV1).not.toHaveBeenCalled();
	});

	it('server exactly 6.10.0 takes the v2 branch (boundary, lowerThan is strict)', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.10.0' } });
		(sendFileMessageV2 as jest.Mock).mockResolvedValue('v2-boundary');

		await expect(sendFileMessage(...args)).resolves.toBe('v2-boundary');
		expect(sendFileMessageV2).toHaveBeenCalledWith(...args);
		expect(sendFileMessageV1).not.toHaveBeenCalled();
	});

	it('returns the value of whichever impl it dispatched (no post-processing)', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.9.9' } });
		(sendFileMessageV1 as jest.Mock).mockResolvedValue('passthrough');
		await expect(sendFileMessage(...args)).resolves.toBe('passthrough');
	});
});
