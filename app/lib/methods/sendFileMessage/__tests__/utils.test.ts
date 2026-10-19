import { Alert } from 'react-native';

import {
	cancelUpload,
	createUploadProgressCallback,
	createUploadRecord,
	copyFileToCacheDirectoryIfNeeded,
	finalizeFailedUpload,
	getUploadPath,
	isUploadActive,
	persistUploadError,
	releaseUploadSlot,
	uploadQueue,
	uploadRetryWaits
} from '../utils';
import { UploadHttpError } from '~/lib/methods/helpers/fileUpload/UploadHttpError';

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('~/i18n', () => ({ t: (k: string) => k, isTranslated: () => false }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
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
	(require('~/lib/methods/helpers/showToast').showToast as jest.Mock).mockClear();
	Object.keys(uploadQueue).forEach(k => delete uploadQueue[k]);
	Object.keys(uploadRetryWaits).forEach(k => delete uploadRetryWaits[k]);
});

describe('cancelUpload', () => {
	it('ends a pending rate limit wait only after it released the upload slot', async () => {
		const queueKey = getUploadPath('/tmp/pic.jpg', 'GENERAL');
		uploadQueue[queueKey] = { send: jest.fn(), cancel: jest.fn() };
		let slotWhenWaitEnded: unknown = 'wait not ended';
		const endWait = jest.fn(() => {
			slotWhenWaitEnded = uploadQueue[queueKey];
		});
		uploadRetryWaits[queueKey] = endWait;

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');

		expect(endWait).toHaveBeenCalledTimes(1);
		expect(slotWhenWaitEnded).toBeUndefined();
	});

	it('cancels the upload that is running when no rate limit wait is pending', async () => {
		const queueKey = getUploadPath('/tmp/pic.jpg', 'GENERAL');
		const running = { send: jest.fn(), cancel: jest.fn() };
		uploadQueue[queueKey] = running;

		await cancelUpload({ path: '/tmp/pic.jpg' } as any, 'GENERAL');

		expect(running.cancel).toHaveBeenCalledTimes(1);
		expect(uploadQueue[queueKey]).toBeUndefined();
	});
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
		const stale: any = {
			id: uploadPath,
			error: true,
			errorStatus: 413,
			errorMessage: 'File is too large',
			progress: 40,
			update: jest.fn((cb: (u: any) => void) => cb(stale))
		};
		mockFind.mockResolvedValue(stale);

		const [path, record] = await createUploadRecord({ rid: 'GENERAL', fileInfo, tmid: undefined });

		expect(Alert.alert).not.toHaveBeenCalled();
		expect(path).toBe(uploadPath);
		expect(record).toBe(stale);
		expect(stale).toMatchObject({ error: false, errorStatus: undefined, errorMessage: undefined, progress: 0 });
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

describe('persistUploadError', () => {
	const { getUploadByPath } = require('~/lib/database/services/Upload');
	const { showToast } = require('~/lib/methods/helpers/showToast');

	const persist = async (error: unknown) => {
		const updated: any = {};
		(getUploadByPath as jest.Mock).mockResolvedValue({
			update: jest.fn((cb: (u: any) => void) => {
				cb(updated);
			})
		});
		await persistUploadError(uploadPath, error);
		return updated;
	};

	beforeEach(() => {
		(getUploadByPath as jest.Mock).mockReset();
	});

	it('stores the HTTP status and server message from an UploadHttpError', async () => {
		const updated = await persist(new UploadHttpError(413, { serverMessage: 'File is too large' }));

		expect(getUploadByPath).toHaveBeenCalledWith(uploadPath);
		expect(updated).toMatchObject({ error: true, errorStatus: 413, errorMessage: 'File is too large' });
		expect(showToast).toHaveBeenCalledWith('error-file-too-large');
	});

	it('stores only the error flag for unknown failures', async () => {
		const updated = await persist(new Error('boom'));

		expect(updated).toMatchObject({ error: true, errorStatus: undefined, errorMessage: undefined });
		expect(showToast).not.toHaveBeenCalled();
	});

	it('announces a failure the user cannot retry away', async () => {
		await persist(new UploadHttpError(415, { serverMessage: 'Not allowed' }));

		expect(showToast).toHaveBeenCalledWith('Not allowed');
	});

	it('announces a permanent failure even when the server sent no usable message', async () => {
		const updated = await persist(new UploadHttpError(405));

		expect(updated).toMatchObject({ errorStatus: 405 });
		expect(showToast).toHaveBeenCalledWith('FileUpload_Error');
	});

	it('stays quiet about a failure that may still resolve itself', async () => {
		const updated = await persist(new UploadHttpError(429, { serverMessage: 'error-too-many-requests' }));

		expect(updated).toMatchObject({ errorStatus: 429 });
		expect(showToast).not.toHaveBeenCalled();
	});

	it('does nothing when the record is gone', async () => {
		(getUploadByPath as jest.Mock).mockResolvedValue(null);

		await expect(persistUploadError(uploadPath, new Error('boom'))).resolves.toBeUndefined();
	});
});

describe('finalizeFailedUpload', () => {
	const { getUploadByPath } = require('~/lib/database/services/Upload');

	beforeEach(() => {
		(getUploadByPath as jest.Mock).mockReset();
	});

	it('does nothing when the upload was cancelled (its queue entry is already gone)', async () => {
		const attempt = {} as any;

		await expect(
			finalizeFailedUpload({
				queueKey: uploadPath,
				error: new Error('boom'),
				upload: attempt
			})
		).resolves.toBeUndefined();

		expect(getUploadByPath).not.toHaveBeenCalled();
	});

	it('persists and rethrows a failure that happened before the upload was ever queued, instead of mistaking it for a cancellation', async () => {
		(getUploadByPath as jest.Mock).mockResolvedValue({ update: jest.fn((cb: (u: any) => void) => cb({})) });
		const error = new Error('encryption failed');

		await expect(finalizeFailedUpload({ queueKey: uploadPath, error, upload: null })).rejects.toBe(error);

		expect(getUploadByPath).toHaveBeenCalledWith(uploadPath);
	});

	it('persists and rethrows a failure before the upload was queued, even when an earlier upload left its queue entry behind', async () => {
		uploadQueue[uploadPath] = {} as any;
		(getUploadByPath as jest.Mock).mockResolvedValue({ update: jest.fn((cb: (u: any) => void) => cb({})) });
		const error = new Error('encryption failed');

		await expect(finalizeFailedUpload({ queueKey: uploadPath, error, upload: null })).rejects.toBe(error);

		expect(getUploadByPath).toHaveBeenCalledWith(uploadPath);
	});

	it('leaves a newer attempt alone instead of clobbering its queue entry', async () => {
		const newerAttempt = {} as any;
		uploadQueue[uploadPath] = newerAttempt;

		await expect(
			finalizeFailedUpload({
				queueKey: uploadPath,
				error: new Error('boom'),
				upload: {} as any
			})
		).resolves.toBeUndefined();

		expect(uploadQueue[uploadPath]).toBe(newerAttempt);
		expect(getUploadByPath).not.toHaveBeenCalled();
	});

	it('persists the error, clears the queue entry, and rethrows for a genuine terminal failure', async () => {
		const attempt = {} as any;
		uploadQueue[uploadPath] = attempt;
		(getUploadByPath as jest.Mock).mockResolvedValue({ update: jest.fn((cb: (u: any) => void) => cb({})) });
		const error = new UploadHttpError(413);

		await expect(finalizeFailedUpload({ queueKey: uploadPath, error, upload: attempt })).rejects.toBe(error);

		expect(getUploadByPath).toHaveBeenCalledWith(uploadPath);
		expect(uploadQueue[uploadPath]).toBeUndefined();
	});
});

describe('releaseUploadSlot', () => {
	it('frees the slot of the attempt that finished', () => {
		const attempt = {} as any;
		uploadQueue[uploadPath] = attempt;

		releaseUploadSlot(uploadPath, attempt);

		expect(isUploadActive(fileInfo.path, 'GENERAL')).toBe(false);
	});

	it('leaves a newer attempt alone', () => {
		const newerAttempt = {} as any;
		uploadQueue[uploadPath] = newerAttempt;

		releaseUploadSlot(uploadPath, {} as any);

		expect(uploadQueue[uploadPath]).toBe(newerAttempt);
	});

	it('leaves the slot alone when no attempt was ever started', () => {
		const other = {} as any;
		uploadQueue[uploadPath] = other;

		releaseUploadSlot(uploadPath, null);

		expect(uploadQueue[uploadPath]).toBe(other);
	});
});

describe('createUploadProgressCallback', () => {
	it('writes the rounded percentage to the upload record', async () => {
		const record: any = {};
		const update = jest.fn((cb: (u: any) => void) => cb(record));
		const db = { write: jest.fn((cb: () => Promise<void>) => cb()) } as any;

		await createUploadProgressCallback(db, { update } as any)(50, 200);

		expect(record.progress).toBe(25);
	});

	it('does nothing when there is no upload record', async () => {
		const db = { write: jest.fn((cb: () => Promise<void>) => cb()) } as any;

		await expect(createUploadProgressCallback(db, null)(50, 200)).resolves.toBeUndefined();
	});

	it('swallows a write failure instead of throwing', async () => {
		const db = { write: jest.fn(() => Promise.reject(new Error('db down'))) } as any;
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

		await expect(createUploadProgressCallback(db, {} as any)(50, 200)).resolves.toBeUndefined();

		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});
});
