/* eslint-disable import/first */
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		methodCallWrapper: jest.fn(),
		getHeaders: jest.fn(() => ({ 'User-Agent': 'RC Mobile test' }))
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: {},
			login: { user: { id: 'u1', token: 't1' } },
			server: { version: '6.0.0' }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => ({
				find: jest.fn().mockRejectedValue(new Error('not found')),
				schema: {}
			})),
			write: jest.fn((fn: any) => Promise.resolve(fn()))
		}
	}
}));

const mockSend = jest.fn().mockResolvedValue({ file: { _id: 'file1', url: '/uploads/file1' } });
const mockState: {
	url?: string;
	headers?: any;
	formData?: any;
} = {};

jest.mock('../helpers/fileUpload', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation((url: string, headers: any, formData: any) => {
		mockState.url = url;
		mockState.headers = headers;
		mockState.formData = formData;
		return { send: mockSend };
	})
}));

jest.mock('./utils', () => ({
	copyFileToCacheDirectoryIfNeeded: jest.fn().mockImplementation((p: string) => Promise.resolve(p)),
	getUploadPath: jest.fn(() => 'upload-path-1'),
	persistUploadError: jest.fn().mockResolvedValue(undefined),
	createUploadRecord: jest.fn().mockResolvedValue(['upload-path-1', { update: jest.fn(), destroyPermanently: jest.fn() }]),
	uploadQueue: {}
}));

const mockEncryptFile = jest.fn().mockResolvedValue({
	file: { path: '/p', name: 'testfile.txt', type: 'text/plain' },
	getContent: undefined,
	fileContent: undefined
});

jest.mock('../../encryption', () => ({
	Encryption: {
		encryptFile: (...args: any[]) => mockEncryptFile(...args)
	}
}));

jest.mock('../helpers/fetch', () => ({
	__esModule: true,
	default: jest.fn().mockResolvedValue({ ok: true })
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({
	sanitizedRaw: jest.fn(() => ({}))
}));

jest.mock('react-native', () => ({
	Alert: { alert: jest.fn() }
}));

import { sendFileMessageV2 } from './sendFileMessageV2';
import sdk from '../../services/sdk';
import fetch from '../helpers/fetch';

const baseFile: any = { name: 'testfile.txt', type: 'text/plain', path: '/p', size: 100 };

beforeEach(() => {
	jest.clearAllMocks();
	mockSend.mockResolvedValue({ file: { _id: 'file1', url: '/uploads/file1' } });
	mockState.url = undefined;
	mockState.headers = undefined;
	mockState.formData = undefined;
	mockEncryptFile.mockResolvedValue({
		file: { path: '/p', name: 'testfile.txt', type: 'text/plain' },
		getContent: undefined,
		fileContent: undefined
	});
	(sdk.getHeaders as jest.Mock).mockReturnValue({ 'User-Agent': 'RC Mobile test' });
	(fetch as jest.Mock).mockResolvedValue({ ok: true });
});

describe('sendFileMessageV2', () => {
	it('builds form data with correct file fields', async () => {
		await sendFileMessageV2('rid1', baseFile, undefined, 'https://server.com', { id: 'u1', token: 'tok1' });

		expect(mockState.formData).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'file',
					type: 'text/plain',
					filename: 'testfile.txt',
					uri: '/p'
				})
			])
		);
	});

	it('includes auth headers from sdk.getHeaders()', async () => {
		await sendFileMessageV2('rid1', baseFile, undefined, 'https://server.com', { id: 'u1', token: 'tok1' });

		expect(mockState.headers).toMatchObject({
			'User-Agent': 'RC Mobile test',
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': 'tok1',
			'X-User-Id': 'u1'
		});
	});

	it('includes content form-data entry when Encryption returns fileContent', async () => {
		mockEncryptFile.mockResolvedValue({
			file: { path: '/p', name: 'testfile.txt', type: 'text/plain' },
			getContent: jest.fn().mockResolvedValue({ algorithm: 'rc4' }),
			fileContent: { algorithm: 'rc4' }
		});

		await sendFileMessageV2('rid1', baseFile, undefined, 'https://server.com', { id: 'u1', token: 'tok1' });

		const contentField = mockState.formData?.find((e: any) => e.name === 'content');
		expect(contentField).toBeDefined();
		expect(JSON.parse(contentField.data)).toEqual({ algorithm: 'rc4' });
	});

	it('throws and calls persistUploadError on upload failure', async () => {
		mockSend.mockRejectedValue(new Error('upload failed'));
		const { persistUploadError, uploadQueue } = require('./utils');
		// ensure uploadQueue has the path entry so the error path triggers persistUploadError
		uploadQueue['upload-path-1'] = {};

		await expect(
			sendFileMessageV2('rid1', baseFile, undefined, 'https://server.com', { id: 'u1', token: 'tok1' })
		).rejects.toThrow('upload failed');

		expect(persistUploadError).toHaveBeenCalledWith(baseFile.path, 'rid1');
	});

	it('confirms upload via POST to /v1/rooms.mediaConfirm', async () => {
		await sendFileMessageV2('rid1', baseFile, undefined, 'https://server.com', { id: 'u1', token: 'tok1' });

		expect(fetch).toHaveBeenCalledWith(
			'https://server.com/api/v1/rooms.mediaConfirm/rid1/file1',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' })
			})
		);
	});
});
