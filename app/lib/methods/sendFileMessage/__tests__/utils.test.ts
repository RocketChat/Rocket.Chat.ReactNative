import {
	cancelUpload,
	claimUploadSlot,
	createUploadProgressCallback,
	createUploadRecord,
	copyFileToCacheDirectoryIfNeeded,
	getUploadPath,
	isUploadActive,
	recordUploadFailure,
	releaseUploadSlot
} from '../utils';
import { getUploadByPath } from '~/lib/database/services/Upload';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/database/services/Upload', () => ({ getUploadByPath: jest.fn() }));
jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: unknown) => raw }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file://cache', copyAsync: jest.fn(() => Promise.resolve()) }));

const mockCreate = jest.fn();

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ create: mockCreate, schema: {} }),
			write: (cb: () => Promise<unknown>) => cb()
		}
	}
}));

const fileInfo = { rid: 'GENERAL', path: '/tmp/pic.jpg', name: 'pic.jpg' } as any;
const uploadPath = getUploadPath(fileInfo.path, fileInfo.rid);

beforeEach(async () => {
	await cancelUpload({ path: fileInfo.path } as any, fileInfo.rid);
	(getUploadByPath as jest.Mock).mockReset();
	mockCreate.mockReset();
	(require('expo-file-system/legacy').copyAsync as jest.Mock).mockClear();
});

describe('cancelUpload', () => {
	it('aborts the send and frees its slot before cancelling the running upload', async () => {
		let abortedWhenCancelled: boolean | undefined;
		const slot = claimUploadSlot(uploadPath)!;
		slot.upload = {
			send: jest.fn(),
			cancel: jest.fn(() => {
				abortedWhenCancelled = slot.controller.signal.aborted;
			})
		};

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');

		expect(abortedWhenCancelled).toBe(true);
		expect(isUploadActive('/tmp/pic.jpg', 'GENERAL')).toBe(false);
	});

	it('aborts a send that is still preparing its upload', async () => {
		const slot = claimUploadSlot(uploadPath)!;

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');

		expect(slot.controller.signal.aborted).toBe(true);
		expect(isUploadActive('/tmp/pic.jpg', 'GENERAL')).toBe(false);
	});
});

describe('getUploadPath / isUploadActive', () => {
	it('composes the deterministic per-room upload path', () => {
		expect(getUploadPath('pic.jpg', 'GENERAL')).toBe('pic.jpg-GENERAL');
	});

	it('isUploadActive true while the file holds an upload slot in the room, false otherwise', () => {
		expect(isUploadActive('/tmp/pic.jpg', 'GENERAL')).toBe(false);
		claimUploadSlot(getUploadPath('/tmp/pic.jpg', 'GENERAL'));
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
	it('reuses a stale record left by a crashed/failed upload instead of blocking', async () => {
		const stale: any = {
			id: uploadPath,
			error: true,
			errorStatus: 413,
			errorMessage: 'File is too large',
			progress: 40,
			tmid: 'old-thread',
			description: 'old caption',
			update: jest.fn((cb: (u: any) => void) => cb(stale))
		};
		(getUploadByPath as jest.Mock).mockResolvedValue(stale);

		const record = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(record).toBe(stale);
		expect(stale).toMatchObject({
			error: false,
			errorStatus: null,
			errorMessage: null,
			progress: 0,
			tmid: undefined,
			description: undefined
		});
	});

	it('creates a new record when none exists', async () => {
		(getUploadByPath as jest.Mock).mockResolvedValue(null);
		const created = { id: uploadPath };
		mockCreate.mockImplementation((cb: (u: any) => void) => {
			const u: any = {};
			cb(u);
			return created;
		});

		const record = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(record).toBe(created);
	});
});

describe('claimUploadSlot', () => {
	it('marks the upload active until its slot is released', () => {
		const slot = claimUploadSlot(uploadPath)!;

		expect(isUploadActive(fileInfo.path, 'GENERAL')).toBe(true);
		releaseUploadSlot(uploadPath, slot);
		expect(isUploadActive(fileInfo.path, 'GENERAL')).toBe(false);
	});

	it('gives no slot while the same file is already uploading to the room', () => {
		const running = claimUploadSlot(uploadPath)!;

		expect(claimUploadSlot(uploadPath)).toBeUndefined();
		expect(isUploadActive(fileInfo.path, fileInfo.rid)).toBe(true);
		releaseUploadSlot(uploadPath, running);
		expect(isUploadActive(fileInfo.path, fileInfo.rid)).toBe(false);
	});
});

describe('releaseUploadSlot', () => {
	it('leaves the slot of a newer send alone', async () => {
		const cancelled = claimUploadSlot(uploadPath)!;
		await cancelUpload({ path: fileInfo.path } as any, fileInfo.rid);
		const newer = claimUploadSlot(uploadPath)!;

		releaseUploadSlot(uploadPath, cancelled);

		expect(isUploadActive(fileInfo.path, fileInfo.rid)).toBe(true);
		releaseUploadSlot(uploadPath, newer);
		expect(isUploadActive(fileInfo.path, fileInfo.rid)).toBe(false);
	});
});

describe('recordUploadFailure', () => {
	it('saves the HTTP status and server message of the failure', async () => {
		const updated: any = { errorStatus: 500, errorMessage: 'stale' };
		const uploadRecord = {
			db: { write: (cb: () => Promise<unknown>) => cb() },
			update: jest.fn((cb: (u: any) => void) => {
				cb(updated);
			})
		} as any;

		await recordUploadFailure(uploadRecord, { errorStatus: 413, errorMessage: 'File is too large' });

		expect(updated).toMatchObject({ error: true, errorStatus: 413, errorMessage: 'File is too large' });
	});

	it('writes the failure through the database the record belongs to', async () => {
		const write = jest.fn((cb: () => Promise<unknown>) => cb());
		const uploadRecord = { db: { write }, update: jest.fn() } as any;

		await recordUploadFailure(uploadRecord, { errorStatus: 500, errorMessage: null });

		expect(write).toHaveBeenCalled();
	});

	it('settles quietly when the record can no longer be written', async () => {
		const uploadRecord = {
			db: { write: (cb: () => Promise<unknown>) => cb() },
			update: jest.fn().mockRejectedValue(new Error('record gone'))
		} as any;

		await expect(recordUploadFailure(uploadRecord, { errorStatus: 413, errorMessage: null })).resolves.toBeUndefined();
	});
});

describe('createUploadProgressCallback', () => {
	it('writes the rounded percentage to the upload record', async () => {
		const record: any = {};
		const update = jest.fn((cb: (u: any) => void) => cb(record));
		const db = { write: jest.fn((cb: () => Promise<void>) => cb()) } as any;

		await createUploadProgressCallback({ db, update } as any)(1, 3);

		expect(record.progress).toBe(33);
	});

	it('swallows a write failure instead of throwing', async () => {
		const db = { write: jest.fn(() => Promise.reject(new Error('db down'))) } as any;
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

		await expect(createUploadProgressCallback({ db } as any)(50, 200)).resolves.toBeUndefined();

		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});
});
