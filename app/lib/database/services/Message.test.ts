import database from '../index';
import { MESSAGES_TABLE } from '../model/Message';
import { type TMessageModel, type TThreadMessageModel } from '../../../definitions';
import { getMessageById } from './Message';
import { getThreadMessageById } from './ThreadMessage';

jest.mock('../index', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('./ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

const mockGet = database.active.get as jest.Mock;
const mockGetThreadMessageById = getThreadMessageById as jest.MockedFunction<typeof getThreadMessageById>;

describe('getMessageById', () => {
	let mockFind: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockFind = jest.fn();
		mockGet.mockReturnValue({ find: mockFind });
	});

	it('returns null when messageId is empty and does not query the database', async () => {
		const result = await getMessageById('');

		expect(result).toBeNull();
		expect(mockGet).not.toHaveBeenCalled();
		expect(mockGetThreadMessageById).not.toHaveBeenCalled();
	});

	describe('without tmid', () => {
		it('resolves the message from the messages table', async () => {
			const message = { id: 'message1', msg: 'Test' } as unknown as TMessageModel;
			mockFind.mockResolvedValue(message);

			const result = await getMessageById('message1');

			expect(result).toBe(message);
			expect(mockGet).toHaveBeenCalledWith(MESSAGES_TABLE);
			expect(mockFind).toHaveBeenCalledWith('message1');
		});

		it('does not look in the thread messages table', async () => {
			mockFind.mockResolvedValue({ id: 'message1' });

			await getMessageById('message1');

			expect(mockGetThreadMessageById).not.toHaveBeenCalled();
		});

		it('returns null when the message does not exist', async () => {
			mockFind.mockRejectedValue(new Error('not found'));

			const result = await getMessageById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('with tmid', () => {
		it('prefers the thread messages table', async () => {
			const threadMessage = { id: 'message1', msg: 'Thread reply' } as unknown as TThreadMessageModel;
			mockGetThreadMessageById.mockResolvedValue(threadMessage as any);

			const result = await getMessageById('message1', 'thread-id');

			expect(result).toBe(threadMessage);
			expect(mockGetThreadMessageById).toHaveBeenCalledWith('message1');
			expect(mockFind).not.toHaveBeenCalled();
		});

		it('falls back to the messages table when not a thread message', async () => {
			const parent = { id: 'parent', msg: 'Thread parent' } as unknown as TMessageModel;
			mockGetThreadMessageById.mockResolvedValue(null);
			mockFind.mockResolvedValue(parent);

			const result = await getMessageById('parent', 'thread-id');

			expect(result).toBe(parent);
			expect(mockGetThreadMessageById).toHaveBeenCalledWith('parent');
			expect(mockFind).toHaveBeenCalledWith('parent');
		});

		it('returns null when the message is in neither table', async () => {
			mockGetThreadMessageById.mockResolvedValue(null);
			mockFind.mockRejectedValue(new Error('not found'));

			const result = await getMessageById('nonexistent', 'thread-id');

			expect(result).toBeNull();
		});
	});
});
