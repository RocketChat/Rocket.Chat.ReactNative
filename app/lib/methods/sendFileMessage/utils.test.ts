import { Alert } from 'react-native';

import { createUploadRecord, copyFileToCacheDirectoryIfNeeded, getUploadPath, isUploadActive, uploadQueue } from './utils';

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('~/i18n', () => ({ t: (k: string) => k }));
jest.mock('../helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/database/services/Upload', () => ({ getUploadByPath: jest.fn() }));
jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: unknown) => raw }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file://cache', copyAsync: jest.fn(() => Promise.resolve()) }));

const mockFind = jest.fn();
const mockCreate = jest.fn();

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ find: mockFind, create: mockCreate, schema: {} }),
			write: (cb: () => Promise<unknown>) => cb()
		}
	}
}));

const fileInfo = { rid: 'GENERAL', path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;
const uploadPath = getUploadPath(fileInfo.path, fileInfo.rid);

beforeEach(() => {
	mockFind.mockReset();
	mockCreate.mockReset();
	(Alert.alert as jest.Mock).mockReset();
	(require('expo-file-system/legacy').copyAsync as jest.Mock).mockClear();
	Object.keys(uploadQueue).forEach(k => delete uploadQueue[k]);
});

describe('getUploadPath / isUploadActive', () => {
	it('composes the deterministic per-room upload path', () => {
		expect(getUploadPath('pic.jpg', 'GENERAL')).toBe('pic.jpg-GENERAL');
	});

	it('isUploadActive true when path present in uploadQueue, false otherwise', () => {
		expect(isUploadActive('/tmp/pic.jpg', 'GENERAL')).toBe(false);
		uploadQueue[getUploadPath('/tmp/pic.jpg', 'GENERAL')] = {} as any;
		expect(isUploadActive('/tmp/pic.jpg', 'GENERAL')).toBe(true);
	});
});

describe('copyFileToCacheDirectoryIfNeeded', () => {
	it('copies only when not-startsWith file:// and name present, returns the new cache path', async () => {
		const { copyAsync } = require('expo-file-system/legacy');
		const result = await copyFileToCacheDirectoryIfNeeded('/tmp/pic.jpg', 'pic.jpg');
		expect(copyAsync).toHaveBeenCalledTimes(1);
		expect(result).toBe('file://cache/pic.jpg');
	});

	it('returns the original path untouched when it already starts file://', async () => {
		const { copyAsync } = require('expo-file-system/legacy');
		const result = await copyFileToCacheDirectoryIfNeeded('file:///tmp/pic.jpg', 'pic.jpg');
		expect(copyAsync).not.toHaveBeenCalled();
		expect(result).toBe('file:///tmp/pic.jpg');
	});

	it('returns original path when name is falsy', async () => {
		const { copyAsync } = require('expo-file-system/legacy');
		const result = await copyFileToCacheDirectoryIfNeeded('/tmp/pic.jpg');
		expect(copyAsync).not.toHaveBeenCalled();
		expect(result).toBe('/tmp/pic.jpg');
	});
});

describe('createUploadRecord', () => {
	it('blocks with alert when the upload is actively in progress', async () => {
		mockFind.mockResolvedValue({ id: uploadPath });
		uploadQueue[uploadPath] = {} as any;

		const result = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(result).toEqual([null, null]);
		expect(Alert.alert).toHaveBeenCalled();
	});

	it('reuses a stale record left by a crashed/failed upload instead of blocking', async () => {
		const stale: any = { id: uploadPath, update: jest.fn((cb: (u: any) => void) => cb(stale)) };
		mockFind.mockResolvedValue(stale);
		// uploadQueue is empty -> no live upload -> record is stale

		const [path, record] = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(Alert.alert).not.toHaveBeenCalled();
		expect(path).toBe(uploadPath);
		expect(record).toBe(stale);
	});

	it('reuses the existing record when force-retry', async () => {
		const existing: any = { id: uploadPath, update: jest.fn((cb: (u: any) => void) => cb(existing)) };
		mockFind.mockResolvedValue(existing);
		uploadQueue[uploadPath] = {} as any;

		const [path, record] = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined, isForceTryAgain: true });

		expect(Alert.alert).not.toHaveBeenCalled();
		expect(path).toBe(uploadPath);
		expect(record).toBe(existing);
	});

	it('creates a new record when none exists', async () => {
		mockFind.mockRejectedValue(new Error('not found'));
		const created = { id: uploadPath };
		mockCreate.mockImplementation((cb: (u: any) => void) => {
			const u: any = {};
			cb(u);
			return created;
		});

		const [path, record] = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(path).toBe(uploadPath);
		expect(record).toBe(created);
	});
});
