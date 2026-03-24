import { prepareQuoteMessage } from './prepareQuoteMessage';
import { getPermalinkMessage } from '../../../lib/methods/getPermalinks';
import { getMessageById } from '../../../lib/database/services/Message';
import { store } from '../../../lib/store/auxStore';
import { compareServerVersion } from '../../../lib/methods/helpers';

// Mock dependencies
jest.mock('../../../lib/methods/getPermalinks', () => ({
	getPermalinkMessage: jest.fn()
}));

jest.mock('../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../../lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../../../lib/methods/helpers/compareServerVersion', () => ({
	compareServerVersion: jest.fn()
}));

const mockGetPermalinkMessage = getPermalinkMessage as jest.MockedFunction<typeof getPermalinkMessage>;
const mockGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockStore = store as jest.Mocked<typeof store>;
const mockCompareServerVersion = compareServerVersion as jest.MockedFunction<typeof compareServerVersion>;

describe('prepareQuoteMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Default mock setup
		mockStore.getState.mockReturnValue({
			server: { version: '6.0.0' }
		} as any);

		mockCompareServerVersion.mockReturnValue(false);
	});

	describe('with empty selectedMessages', () => {
		test('should return only text input when no messages selected', async () => {
			const textFromInput = 'Hello world';
			const selectedMessages: string[] = [];

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(result).toBe('Hello world');
			expect(mockGetMessageById).not.toHaveBeenCalled();
			expect(mockGetPermalinkMessage).not.toHaveBeenCalled();
		});

		test('should return empty string when no text and no messages', async () => {
			const textFromInput = '';
			const selectedMessages: string[] = [];

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(result).toBe('');
		});
	});

	describe('with selectedMessages', () => {
		const mockMessage = {
			id: 'message1',
			msg: 'Test message',
			u: { username: 'testuser' },
			ts: new Date()
		};

		test('should prepare quote with permalink for server version >= 5.0.0', async () => {
			const textFromInput = 'My reply';
			const selectedMessages = ['message1'];
			const permalink = 'https://example.com/message/message1';

			mockCompareServerVersion.mockReturnValue(false); // >= 5.0.0
			mockGetMessageById.mockResolvedValue(mockMessage as any);
			mockGetPermalinkMessage.mockResolvedValue(permalink);

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(mockGetMessageById).toHaveBeenCalledWith('message1');
			expect(mockGetPermalinkMessage).toHaveBeenCalledWith(mockMessage);
			expect(result).toBe(`[ ](${permalink}) \nMy reply`);
		});

		test('should prepare quote with space separator for server version < 5.0.0', async () => {
			const textFromInput = 'My reply';
			const selectedMessages = ['message1'];
			const permalink = 'https://example.com/message/message1';

			mockCompareServerVersion.mockReturnValue(true); // < 5.0.0
			mockGetMessageById.mockResolvedValue(mockMessage as any);
			mockGetPermalinkMessage.mockResolvedValue(permalink);

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(mockCompareServerVersion).toHaveBeenCalledWith('6.0.0', 'lowerThan', '5.0.0');
			expect(result).toBe(`[ ](${permalink})  My reply`);
		});

		test('should handle multiple selected messages', async () => {
			const textFromInput = 'My reply';
			const selectedMessages = ['message1', 'message2'];
			const permalink1 = 'https://example.com/message/message1';
			const permalink2 = 'https://example.com/message/message2';

			const mockMessage2 = { ...mockMessage, id: 'message2' };

			mockCompareServerVersion.mockReturnValue(false); // >= 5.0.0
			mockGetMessageById.mockResolvedValueOnce(mockMessage as any).mockResolvedValueOnce(mockMessage2 as any);
			mockGetPermalinkMessage.mockResolvedValueOnce(permalink1).mockResolvedValueOnce(permalink2);

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(mockGetMessageById).toHaveBeenCalledTimes(2);
			expect(mockGetPermalinkMessage).toHaveBeenCalledTimes(2);
			expect(result).toBe(`[ ](${permalink1}) \n[ ](${permalink2}) \nMy reply`);
		});

		test('should skip messages that are not found', async () => {
			const textFromInput = 'My reply';
			const selectedMessages = ['message1', 'nonexistent'];

			mockCompareServerVersion.mockReturnValue(false);
			mockGetMessageById.mockResolvedValueOnce(mockMessage as any).mockResolvedValueOnce(null);
			mockGetPermalinkMessage.mockResolvedValue('https://example.com/message/message1');

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(mockGetMessageById).toHaveBeenCalledTimes(2);
			expect(mockGetPermalinkMessage).toHaveBeenCalledTimes(1);
			expect(result).toBe('[ ](https://example.com/message/message1) \nMy reply');
		});

		test('should handle empty text input with quotes', async () => {
			const textFromInput = '';
			const selectedMessages = ['message1'];
			const permalink = 'https://example.com/message/message1';

			mockCompareServerVersion.mockReturnValue(false);
			mockGetMessageById.mockResolvedValue(mockMessage as any);
			mockGetPermalinkMessage.mockResolvedValue(permalink);

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(result).toBe(`[ ](${permalink}) \n`);
		});

		test('should throw error when getPermalinkMessage fails', async () => {
			const textFromInput = 'My reply';
			const selectedMessages = ['message1'];

			mockCompareServerVersion.mockReturnValue(false);
			mockGetMessageById.mockResolvedValue(mockMessage as any);
			mockGetPermalinkMessage.mockRejectedValue(new Error('Network error'));

			// Should throw the error
			await expect(prepareQuoteMessage(textFromInput, selectedMessages)).rejects.toThrow('Network error');
		});
	});

	describe('server version handling', () => {
		test('should use newline separator for modern servers', async () => {
			const textFromInput = 'Reply';
			const selectedMessages = ['message1'];

			mockStore.getState.mockReturnValue({
				server: { version: '6.0.0' }
			} as any);
			mockCompareServerVersion.mockReturnValue(false);
			mockGetMessageById.mockResolvedValue({
				id: 'message1',
				msg: 'Test'
			} as any);
			mockGetPermalinkMessage.mockResolvedValue('https://example.com/link');

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(result).toContain('\n');
		});

		test('should use space separator for legacy servers', async () => {
			const textFromInput = 'Reply';
			const selectedMessages = ['message1'];

			mockStore.getState.mockReturnValue({
				server: { version: '4.0.0' }
			} as any);
			mockCompareServerVersion.mockReturnValue(true);
			mockGetMessageById.mockResolvedValue({
				id: 'message1',
				msg: 'Test'
			} as any);
			mockGetPermalinkMessage.mockResolvedValue('https://example.com/link');

			const result = await prepareQuoteMessage(textFromInput, selectedMessages);

			expect(result).not.toContain('\n');
			expect(result).toContain(' ');
		});
	});
});
