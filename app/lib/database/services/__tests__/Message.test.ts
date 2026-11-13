import database from '~/lib/database';
import { MESSAGES_TABLE } from '~/lib/database/model/Message';
import { type TMessageModel, type TThreadMessageModel } from '~/definitions';
import { getMessageById, getMessageOrThreadMessageById } from '~/lib/database/services/Message';
import { getThreadMessageById } from '~/lib/database/services/ThreadMessage';

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('~/lib/database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

const mockGet = database.active.get as jest.Mock;
const mockGetThreadMessageById = getThreadMessageById as jest.MockedFunction<typeof getThreadMessageById>;

let mockFind: jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockFind = jest.fn();
	mockGet.mockReturnValue({ find: mockFind });
});

describe('getMessageById', () => {
	it('returns null when messageId is empty and does not query the database', async () => {
		const result = await getMessageById('');

		expect(result).toBeNull();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('resolves the message from the messages table', async () => {
		const message = { id: 'message1', msg: 'Test' } as unknown as TMessageModel;
		mockFind.mockResolvedValue(message);

		const result = await getMessageById('message1');

		expect(result).toBe(message);
		expect(mockGet).toHaveBeenCalledWith(MESSAGES_TABLE);
		expect(mockFind).toHaveBeenCalledWith('message1');
		expect(mockGetThreadMessageById).not.toHaveBeenCalled();
	});

	it('returns null when the message does not exist', async () => {
		mockFind.mockRejectedValue(new Error('not found'));

		const result = await getMessageById('nonexistent');

		expect(result).toBeNull();
		expect(mockGetThreadMessageById).not.toHaveBeenCalled();
	});
});

describe('getMessageOrThreadMessageById', () => {
	it('returns null when messageId is empty and does not query the database', async () => {
		const result = await getMessageOrThreadMessageById('');

		expect(result).toBeNull();
		expect(mockGet).not.toHaveBeenCalled();
		expect(mockGetThreadMessageById).not.toHaveBeenCalled();
	});

	describe('without tmid', () => {
		it('returns the message from the messages table', async () => {
			const message = { id: 'message1' } as unknown as TMessageModel;
			mockFind.mockResolvedValue(message);

			const result = await getMessageOrThreadMessageById('message1');

			expect(result).toBe(message);
			expect(mockGetThreadMessageById).not.toHaveBeenCalled();
		});

		it('falls back to the thread messages table', async () => {
			const threadMessage = { id: 'reply1', msg: 'Thread reply' } as unknown as TThreadMessageModel;
			mockFind.mockRejectedValue(new Error('not found'));
			mockGetThreadMessageById.mockResolvedValue(threadMessage);

			const result = await getMessageOrThreadMessageById('reply1');

			expect(result).toBe(threadMessage);
			expect(mockGetThreadMessageById).toHaveBeenCalledWith('reply1');
		});

		it('returns null when the message is in neither table', async () => {
			mockFind.mockRejectedValue(new Error('not found'));
			mockGetThreadMessageById.mockResolvedValue(null);

			const result = await getMessageOrThreadMessageById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('with tmid', () => {
		it('prefers the thread messages table', async () => {
			const threadMessage = { id: 'message1', msg: 'Thread reply' } as unknown as TThreadMessageModel;
			mockGetThreadMessageById.mockResolvedValue(threadMessage);

			const result = await getMessageOrThreadMessageById('message1', 'thread-id');

			expect(result).toBe(threadMessage);
			expect(mockGetThreadMessageById).toHaveBeenCalledWith('message1');
			expect(mockFind).not.toHaveBeenCalled();
		});

		it('falls back to the messages table when not a thread message', async () => {
			const parent = { id: 'parent', msg: 'Thread parent' } as unknown as TMessageModel;
			mockGetThreadMessageById.mockResolvedValue(null);
			mockFind.mockResolvedValue(parent);

			const result = await getMessageOrThreadMessageById('parent', 'thread-id');

			expect(result).toBe(parent);
			expect(mockFind).toHaveBeenCalledWith('parent');
		});

		it('returns null when the message is in neither table', async () => {
			mockGetThreadMessageById.mockResolvedValue(null);
			mockFind.mockRejectedValue(new Error('not found'));

			const result = await getMessageOrThreadMessageById('nonexistent', 'thread-id');

			expect(result).toBeNull();
		});
	});
});
