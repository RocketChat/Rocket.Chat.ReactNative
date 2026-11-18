import { Alert } from 'react-native';

import { sendFileMessage } from '../sendFileMessage';
import { sendFileMessageV2 } from '../sendFileMessageV2';
import { cancelUpload, getUploadPath, isUploadActive, uploadQueue } from '../utils';

type UploadRow = {
	id: string;
	path: string;
	error: boolean;
	progress: number;
	update: (change: (row: UploadRow) => void) => Promise<void>;
	destroyPermanently: () => Promise<void>;
};

type PendingSend = { resolve: (response: unknown) => void; reject: (error: unknown) => void };

const mockRows = new Map<string, UploadRow>();
const mockSends: PendingSend[] = [];

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../helpers/fetch', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve({})) }));
jest.mock('~/lib/database/services/Upload', () => ({
	getUploadByPath: (id: string) => Promise.resolve(mockRows.get(id) ?? null)
}));
jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: unknown) => raw }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file://cache/', copyAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('~/lib/encryption', () => ({
	Encryption: {
		encryptFile: jest.fn((_rid: string, file: unknown) =>
			Promise.resolve({ file, getContent: undefined, fileContent: undefined })
		)
	}
}));
jest.mock('../../helpers/fileUpload', () => ({
	__esModule: true,
	default: class {
		private pending?: PendingSend;

		send() {
			return new Promise((resolve, reject) => {
				this.pending = { resolve, reject };
				mockSends.push(this.pending);
			});
		}

		cancel() {
			setImmediate(() => this.pending?.reject(new Error('Upload Cancelled')));
		}
	}
}));

jest.mock('~/lib/database', () => {
	const createRow = (id: string): UploadRow => {
		const row: UploadRow = {
			id,
			path: '',
			error: false,
			progress: 0,
			update: async change => change(row),
			destroyPermanently: async () => {
				mockRows.delete(id);
			}
		};
		return row;
	};
	const uploads = {
		schema: {},
		find: async (id: string) => {
			const row = mockRows.get(id);
			if (!row) {
				throw new Error(`Record uploads#${id} not found`);
			}
			return row;
		},
		create: async (build: (row: UploadRow & { _raw?: { id: string } }) => void) => {
			const draft: UploadRow & { _raw?: { id: string } } = createRow('');
			build(draft);
			const row = Object.assign(createRow(draft._raw!.id), { path: draft.path });
			mockRows.set(row.id, row);
			return row;
		}
	};
	return {
		__esModule: true,
		default: { active: { get: () => uploads, write: (work: () => Promise<unknown>) => work() } }
	};
});

const rid = 'room-id';
const server = 'https://server';
const user = { id: 'user-id', token: 'token' };
const file = () => ({ rid, path: 'file:///tmp/pic.jpg', name: 'pic.jpg', type: 'image/jpeg', size: 1 }) as any;
const uploadPath = getUploadPath('file:///tmp/pic.jpg', rid);

const flush = () => new Promise(resolve => setImmediate(resolve));

const latestSend = () => mockSends[mockSends.length - 1];

beforeEach(() => {
	mockRows.clear();
	mockSends.length = 0;
	Object.keys(uploadQueue).forEach(key => delete uploadQueue[key]);
	(Alert.alert as jest.Mock).mockClear();
	jest.spyOn(console, 'error').mockImplementation(() => {});
	jest.spyOn(console, 'log').mockImplementation(() => {});
});

describe.each([
	['sendFileMessageV2', sendFileMessageV2, { file: { _id: 'file-id', url: '/file' } }],
	['sendFileMessage (servers below 6.10)', sendFileMessage, {}]
])('%s upload lifecycle', (_name, send, acceptedResponse) => {
	it('sends the same file again after the server rejected it', async () => {
		const first = send(rid, file(), undefined, server, user);
		await flush();
		latestSend().reject({ status: 403 });
		await expect(first).rejects.toEqual({ status: 403 });
		expect(mockRows.get(uploadPath)?.error).toBe(true);
		expect(isUploadActive('file:///tmp/pic.jpg', rid)).toBe(false);

		const second = send(rid, file(), undefined, server, user);
		await flush();
		expect(Alert.alert).not.toHaveBeenCalled();
		expect(mockSends).toHaveLength(2);
		latestSend().resolve(acceptedResponse);
		await expect(second).resolves.toBeUndefined();
		expect(mockRows.has(uploadPath)).toBe(false);
	});

	it('sends the same file again after it was sent', async () => {
		const first = send(rid, file(), undefined, server, user);
		await flush();
		latestSend().resolve(acceptedResponse);
		await first;
		expect(isUploadActive('file:///tmp/pic.jpg', rid)).toBe(false);

		const second = send(rid, file(), undefined, server, user);
		await flush();
		expect(Alert.alert).not.toHaveBeenCalled();
		expect(mockSends).toHaveLength(2);
		latestSend().resolve(acceptedResponse);
		await second;
	});

	it('refuses a second send while the first is uploading, without failing the running upload', async () => {
		const first = send(rid, file(), undefined, server, user);
		await flush();

		await expect(send(rid, file(), undefined, server, user)).resolves.toBeUndefined();
		expect(Alert.alert).toHaveBeenCalledWith('FileUpload_Error', 'Upload_in_progress');
		expect(mockRows.get(uploadPath)?.error).toBe(false);
		expect(mockSends).toHaveLength(1);

		latestSend().resolve(acceptedResponse);
		await expect(first).resolves.toBeUndefined();
	});

	it('settles a cancelled upload quietly and lets the file be sent again', async () => {
		const first = send(rid, file(), undefined, server, user);
		await flush();
		await cancelUpload(mockRows.get(uploadPath) as any, rid);
		await expect(first).resolves.toBeUndefined();
		expect(mockRows.has(uploadPath)).toBe(false);

		const second = send(rid, file(), undefined, server, user);
		await flush();
		expect(Alert.alert).not.toHaveBeenCalled();
		latestSend().resolve(acceptedResponse);
		await second;
	});
});
