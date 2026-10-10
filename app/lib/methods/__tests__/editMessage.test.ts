import { editMessage } from '../editMessage';

const mockEncryptMessage = jest.fn();
jest.mock('../../encryption', () => ({
	Encryption: {
		encryptMessage: (...args: unknown[]) => mockEncryptMessage(...args)
	}
}));

const mockPost = jest.fn();
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		post: (...args: unknown[]) => mockPost(...args)
	}
}));

describe('editMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockEncryptMessage.mockImplementation(message => Promise.resolve(message));
	});

	it('closes an unclosed code block before encrypting and sending', async () => {
		await editMessage({ id: 'msgId', rid: 'GENERAL', msg: '```js\nconst a = 1;' });

		expect(mockEncryptMessage).toHaveBeenCalledWith(expect.objectContaining({ msg: '```js\nconst a = 1;\n```' }));
		expect(mockPost).toHaveBeenCalledWith('chat.update', {
			roomId: 'GENERAL',
			msgId: 'msgId',
			text: '```js\nconst a = 1;\n```'
		});
	});
});
