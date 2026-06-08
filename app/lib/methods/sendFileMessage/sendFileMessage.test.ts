/* eslint-disable import/first */
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		getHeaders: jest.fn(() => ({ 'User-Agent': 'RC Mobile test' }))
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: jest.fn(() => ({ server: { version: '6.10.0' } })) }
}));

jest.mock('../helpers', () => ({
	compareServerVersion: jest.fn((_v: string, op: string, _target: string) => {
		// 6.10.0 vs 6.10.0 → not lowerThan
		if (op === 'lowerThan') return false;
		return true;
	})
}));

jest.mock('../../database', () => {
	const update = jest.fn();
	const destroyPermanently = jest.fn();
	const uploadRecord = {
		id: undefined,
		update,
		destroyPermanently
	};
	return {
		__esModule: true,
		default: {
			active: {
				get: jest.fn(() => ({
					find: jest.fn().mockRejectedValue(new Error('not found')),
					create: jest.fn((cb: any) => {
						cb(uploadRecord);
						return Promise.resolve(uploadRecord);
					}),
					schema: {}
				})),
				write: jest.fn((fn: any) => Promise.resolve(fn()))
			}
		},
		__uploadRecord: uploadRecord,
		__update: update
	};
});

const mockSend = jest.fn().mockResolvedValue({ file: { _id: 'f1', url: '/f1' } });
const mockState: {
	progressCb?: (loaded: number, total: number) => void;
	headers?: any;
	url?: string;
	formData?: any;
} = {};

jest.mock('../helpers/fileUpload', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation((url: string, headers: any, formData: any, progressCb: any) => {
		mockState.url = url;
		mockState.headers = headers;
		mockState.formData = formData;
		mockState.progressCb = progressCb;
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
	file: { path: '/p', name: 'n', type: 't' },
	getContent: jest.fn().mockResolvedValue({ algorithm: 'a' }),
	fileContent: { algorithm: 'a' }
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

import { sendFileMessage } from './index';
import { sendFileMessage as sendFileMessageV1 } from './sendFileMessage';
import { sendFileMessageV2 } from './sendFileMessageV2';
import sdk from '../../services/sdk';
import fetch from '../helpers/fetch';
import { store } from '../../store/auxStore';

beforeEach(() => {
	mockSend.mockClear();
	mockState.progressCb = undefined;
	mockState.headers = undefined;
	mockState.url = undefined;
	mockState.formData = undefined;
	mockEncryptFile.mockClear();
	(fetch as jest.Mock).mockClear();
	(sdk.getHeaders as jest.Mock).mockReset().mockReturnValue({ 'User-Agent': 'RC Mobile test' });
	(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.10.0' } });
});

describe('sendFileMessage router', () => {
	it('routes to V1 for RC < 6.10.0', async () => {
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '6.9.0' } });
		const { compareServerVersion } = require('../helpers');
		(compareServerVersion as jest.Mock).mockReturnValueOnce(true);
		await sendFileMessage('rid', { name: 'a', type: 't', path: '/p', size: 1 } as any, undefined, 'https://x.com');
		expect(mockState.url).toBe('https://x.com/api/v1/rooms.upload/rid');
	});

	it('routes to V2 for RC >= 6.10.0', async () => {
		const { compareServerVersion } = require('../helpers');
		(compareServerVersion as jest.Mock).mockReturnValueOnce(false);
		await sendFileMessage('rid', { name: 'a', type: 't', path: '/p', size: 1 } as any, undefined, 'https://x.com');
		expect(mockState.url).toBe('https://x.com/api/v1/rooms.media/rid');
	});
});

describe('sendFileMessage V1 headers', () => {
	it('spreads sdk.getHeaders() + Content-Type', async () => {
		await sendFileMessageV1(
			'rid',
			{ name: 'a', type: 't', path: '/p', size: 1, store: 'Uploads', description: '' } as any,
			undefined,
			'https://x.com'
		);
		expect(mockState.headers).toMatchObject({
			'User-Agent': 'RC Mobile test',
			'Content-Type': 'multipart/form-data'
		});
	});

	it('progress callback updates upload record progress field', async () => {
		await sendFileMessageV1(
			'rid',
			{ name: 'a', type: 't', path: '/p', size: 1, store: 'Uploads', description: '' } as any,
			undefined,
			'https://x.com'
		);
		const dbMod = require('../../database');
		await mockState.progressCb!(50, 100);
		expect(dbMod.__update).toHaveBeenCalledWith(expect.any(Function));
		// The update callback assigns u.progress = Math.floor((50/100)*100) = 50
		const updateFn = dbMod.__update.mock.calls[0][0];
		const u: any = {};
		updateFn(u);
		expect(u.progress).toBe(50);
	});
});

describe('sendFileMessage V2', () => {
	const baseFile = { name: 'a', type: 't', path: '/p', size: 1 } as any;

	it('invokes Encryption.encryptFile with (rid, fileInfo)', async () => {
		await sendFileMessageV2('rid', baseFile, undefined, 'https://x.com');
		expect(mockEncryptFile).toHaveBeenCalledWith('rid', baseFile);
	});

	it('uploads to /v1/rooms.media/{rid} with merged headers', async () => {
		await sendFileMessageV2('rid', baseFile, undefined, 'https://x.com');
		expect(mockState.url).toBe('https://x.com/api/v1/rooms.media/rid');
		expect(mockState.headers).toMatchObject({
			'User-Agent': 'RC Mobile test',
			'Content-Type': 'multipart/form-data'
		});
	});

	it('confirms via /v1/rooms.mediaConfirm with JSON Content-Type override', async () => {
		await sendFileMessageV2('rid', baseFile, undefined, 'https://x.com');
		expect(fetch).toHaveBeenCalledWith(
			'https://x.com/api/v1/rooms.mediaConfirm/rid/f1',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({ 'Content-Type': 'application/json' })
			})
		);
	});

	it('includes a content form-data entry when Encryption returns fileContent', async () => {
		await sendFileMessageV2('rid', baseFile, undefined, 'https://x.com');
		const contentField = mockState.formData.find((e: any) => e.name === 'content');
		expect(contentField).toBeDefined();
		expect(JSON.parse(contentField.data)).toEqual({ algorithm: 'a' });
	});
});
