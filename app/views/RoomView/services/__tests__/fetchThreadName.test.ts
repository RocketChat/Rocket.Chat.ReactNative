import { getThreadById } from '../../../../lib/database/services/Thread';
import getThreadName from '../../../../lib/methods/getThreadName';
import { fetchThreadName } from '../fetchThreadName';

jest.mock('../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));
jest.mock('../../../../lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread title'))
}));

const mockGetThreadById = getThreadById as jest.Mock;
const mockGetThreadName = getThreadName as jest.Mock;

describe('fetchThreadName', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetThreadById.mockResolvedValue(null);
	});

	it('reports a removed thread even when the caller already has a name', async () => {
		mockGetThreadById.mockResolvedValue({ t: 'rm' });

		await expect(fetchThreadName('rid-1', 'tmid-1', 'msg-1', 'known name')).resolves.toBe('message removed');
		expect(mockGetThreadName).not.toHaveBeenCalled();
	});

	it('keeps the name the caller already has', async () => {
		await expect(fetchThreadName('rid-1', 'tmid-1', 'msg-1', 'known name')).resolves.toBe('known name');
		expect(mockGetThreadName).not.toHaveBeenCalled();
	});

	it('resolves the thread name when the caller has none', async () => {
		await expect(fetchThreadName('rid-1', 'tmid-1', 'msg-1')).resolves.toBe('Thread title');
		expect(mockGetThreadName).toHaveBeenCalledWith('rid-1', 'tmid-1', 'msg-1');
	});
});
