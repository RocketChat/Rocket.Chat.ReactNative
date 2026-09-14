import * as FileSystem from 'expo-file-system/legacy';

import { sendFileMessage } from '../sendFileMessage';
import { canConvertLongMessageToFile, isTooLongMessage, sendLongMessageAsFile } from './processTooLongMessage';

jest.mock('expo-file-system/legacy', () => ({
	cacheDirectory: 'file:///cache/',
	EncodingType: { UTF8: 'utf8' },
	writeAsStringAsync: jest.fn(),
	getInfoAsync: jest.fn(),
	deleteAsync: jest.fn(() => Promise.resolve())
}));

jest.mock('../sendFileMessage', () => ({
	sendFileMessage: jest.fn()
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('isTooLongMessage', () => {
	it('returns false when no limit is configured yet', () => {
		expect(isTooLongMessage('hello', undefined)).toBe(false);
		expect(isTooLongMessage('hello', 0)).toBe(false);
	});

	it('compares against the limit like web (msg.length > max)', () => {
		expect(isTooLongMessage('12345', 5)).toBe(false);
		expect(isTooLongMessage('123456', 5)).toBe(true);
	});
});

describe('canConvertLongMessageToFile', () => {
	it('requires uploads + convert enabled and not editing', () => {
		expect(canConvertLongMessageToFile({ isEditing: false, fileUploadEnabled: true, allowConvert: true })).toBe(true);
		expect(canConvertLongMessageToFile({ isEditing: true, fileUploadEnabled: true, allowConvert: true })).toBe(false);
		expect(canConvertLongMessageToFile({ isEditing: false, fileUploadEnabled: false, allowConvert: true })).toBe(false);
		expect(canConvertLongMessageToFile({ isEditing: false, fileUploadEnabled: true, allowConvert: false })).toBe(false);
	});
});

describe('sendLongMessageAsFile', () => {
	it('writes a .txt file and sends it via sendFileMessage', async () => {
		(FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 6 });
		(sendFileMessage as jest.Mock).mockResolvedValue(undefined);

		await sendLongMessageAsFile({
			rid: 'GENERAL',
			tmid: undefined,
			server: 'https://open.rocket.chat',
			user: { id: 'id', token: 'token' },
			username: 'tester',
			text: '123456'
		});

		expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(expect.stringContaining('.txt'), '123456', expect.anything());
		expect(sendFileMessage).toHaveBeenCalledWith(
			'GENERAL',
			expect.objectContaining({ name: expect.stringContaining('.txt'), type: 'text/plain', size: 6 }),
			undefined,
			'https://open.rocket.chat',
			{ id: 'id', token: 'token' }
		);
		expect(FileSystem.deleteAsync).toHaveBeenCalled();
	});

	it('still cleans up the temp file when creation fails', async () => {
		(FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

		await expect(
			sendLongMessageAsFile({
				rid: 'GENERAL',
				tmid: undefined,
				server: 'https://open.rocket.chat',
				user: { id: 'id', token: 'token' },
				username: 'tester',
				text: '123456'
			})
		).rejects.toThrow('disk full');

		expect(sendFileMessage).not.toHaveBeenCalled();
		expect(FileSystem.deleteAsync).toHaveBeenCalled();
	});
});
