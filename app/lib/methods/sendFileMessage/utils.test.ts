import { Alert } from 'react-native';

import { createUploadRecord, getUploadPath, uploadQueue } from './utils';

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('../../../i18n', () => ({ t: (k: string) => k }));
jest.mock('../helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../database/services/Upload', () => ({ getUploadByPath: jest.fn() }));
jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: unknown) => raw }));

const mockFind = jest.fn();
const mockCreate = jest.fn();

jest.mock('../../database', () => ({
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
	Object.keys(uploadQueue).forEach(k => delete uploadQueue[k]);
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
