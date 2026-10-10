import { editMessage } from './editMessage';

const mockEncryptMessage = jest.fn();
jest.mock('../encryption', () => ({
	Encryption: {
		encryptMessage: (...args: unknown[]) => mockEncryptMessage(...args)
	}
}));

const mockPost = jest.fn();
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		post: (...args: unknown[]) => mockPost(...args)
	}
}));

describe('editMessage', () => {
	const base = { id: 'msgId', rid: 'GENERAL' };

	beforeEach(() => {
		jest.clearAllMocks();
		mockEncryptMessage.mockImplementation(message => Promise.resolve(message));
	});

	it('closes an unclosed code block in the text it sends', async () => {
		await editMessage({ ...base, msg: '```js\nconst a = 1;' });

		expect(mockPost).toHaveBeenCalledWith('chat.update', {
			roomId: 'GENERAL',
			msgId: 'msgId',
			text: '```js\nconst a = 1;\n```'
		});
	});

	it('closes an unclosed code block before encrypting', async () => {
		await editMessage({ ...base, msg: '```js\nconst a = 1;' });

		expect(mockEncryptMessage).toHaveBeenCalledWith(expect.objectContaining({ msg: '```js\nconst a = 1;\n```' }));
	});

	it('leaves a balanced code block untouched', async () => {
		await editMessage({ ...base, msg: '```js\nconst a = 1;\n```' });

		expect(mockPost).toHaveBeenCalledWith('chat.update', expect.objectContaining({ text: '```js\nconst a = 1;\n```' }));
	});
});
