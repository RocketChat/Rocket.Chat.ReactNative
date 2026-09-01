import { getPermissions } from './getPermissions';
import type { IPermission } from '../../definitions';

const UNIQUE_CONSTRAINT_ERROR = 'Failed to execute db update - sqlite error 1555 (UNIQUE constraint failed: permissions.id)';

interface IPermissionRow {
	id: string;
	roles: string[];
	_updatedAt: string;
}

type TPermissionDraft = { _raw: { id: string }; roles: string[]; _updatedAt: string };

type TBatchOperation =
	| { type: 'create'; model: TPermissionDraft }
	| { type: 'update'; row: IPermissionRow; apply: (row: IPermissionRow) => void }
	| { type: 'destroy'; row: IPermissionRow };

const mockPermissionsTable = new Map<string, IPermissionRow>();
const mockLoggedErrors: Error[] = [];

const makePermissionModel = (row: IPermissionRow) => ({
	id: row.id,
	roles: row.roles,
	_updatedAt: row._updatedAt,
	prepareUpdate: (apply: (row: IPermissionRow) => void): TBatchOperation => ({ type: 'update', row, apply }),
	prepareDestroyPermanently: (): TBatchOperation => ({ type: 'destroy', row })
});

const mockPermissionsCollection = {
	schema: { columns: {} },
	query: () => ({ fetch: () => Promise.resolve([...mockPermissionsTable.values()].map(makePermissionModel)) }),
	prepareCreate: (build: (model: TPermissionDraft) => void): TBatchOperation => {
		const model: TPermissionDraft = { _raw: { id: '' }, roles: [], _updatedAt: '' };
		build(model);
		return { type: 'create', model };
	}
};

let mockWriterQueue: Promise<unknown> = Promise.resolve();

const mockDatabase = {
	get: () => mockPermissionsCollection,
	write: <T>(writer: () => Promise<T>) => {
		const settled = mockWriterQueue.then(writer);
		mockWriterQueue = settled.catch(() => undefined);
		return settled as Promise<T>;
	},
	batch: (operations: TBatchOperation[]) => {
		operations.forEach(operation => {
			if (operation.type === 'destroy') {
				mockPermissionsTable.delete(operation.row.id);
				return;
			}
			if (operation.type === 'update') {
				operation.apply(operation.row);
				mockPermissionsTable.set(operation.row.id, operation.row);
				return;
			}
			const { id } = operation.model._raw;
			if (mockPermissionsTable.has(id)) {
				throw new Error(UNIQUE_CONSTRAINT_ERROR);
			}
			mockPermissionsTable.set(id, { id, roles: operation.model.roles, _updatedAt: operation.model._updatedAt });
		});
		return Promise.resolve();
	}
};

jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: { id: string }) => raw }));
jest.mock('../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));
jest.mock('../store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.0.0' } }), dispatch: jest.fn() }
}));
jest.mock('./helpers/log', () => ({ __esModule: true, default: (error: Error) => mockLoggedErrors.push(error) }));

let mockServerUpdate: IPermission[] = [];
let mockServerRemove: IPermission[] = [];
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		subscribe: jest.fn(),
		get: jest.fn(async () => {
			await new Promise(resolve => setTimeout(resolve, 5));
			return { success: true, update: mockServerUpdate, remove: mockServerRemove };
		})
	}
}));

const makeServerPermission = (id: string, roles: string[], updatedAt = '2026-01-01T00:00:00.000Z') =>
	({ _id: id, roles, _updatedAt: updatedAt }) as unknown as IPermission;

const makeRemovedPermission = (id: string) => ({ _id: id }) as unknown as IPermission;

const storedRoles = (id: string) => mockPermissionsTable.get(id)?.roles;

describe('getPermissions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPermissionsTable.clear();
		mockWriterQueue = Promise.resolve();
		mockLoggedErrors.length = 0;
		mockServerUpdate = [makeServerPermission('edit-message', ['admin']), makeServerPermission('mute-user', ['admin'])];
		mockServerRemove = [];
	});

	it('does not violate the permissions unique constraint when two runs race on an empty database', async () => {
		await Promise.all([getPermissions(), getPermissions()]);

		expect(mockLoggedErrors).toHaveLength(0);
		expect([...mockPermissionsTable.keys()]).toEqual(['edit-message', 'mute-user']);
	});

	it('keeps the last entry when the server repeats an _id in one payload', async () => {
		mockServerUpdate = [...mockServerUpdate, makeServerPermission('edit-message', ['user'], '2026-01-02T00:00:00.000Z')];

		await getPermissions();

		expect(mockLoggedErrors).toHaveLength(0);
		expect([...mockPermissionsTable.keys()]).toEqual(['edit-message', 'mute-user']);
		expect(storedRoles('edit-message')).toEqual(['user']);
	});

	it('persists updated roles across sequential runs', async () => {
		await getPermissions();
		mockServerUpdate = [makeServerPermission('edit-message', ['owner'], '2026-01-02T00:00:00.000Z')];

		await getPermissions();

		expect(mockLoggedErrors).toHaveLength(0);
		expect([...mockPermissionsTable.keys()]).toEqual(['edit-message', 'mute-user']);
		expect(storedRoles('edit-message')).toEqual(['owner']);
	});

	it('deletes permissions the server removed', async () => {
		await getPermissions();
		mockServerUpdate = [];
		mockServerRemove = [makeRemovedPermission('mute-user')];

		await getPermissions();

		expect(mockLoggedErrors).toHaveLength(0);
		expect([...mockPermissionsTable.keys()]).toEqual(['edit-message']);
	});

	it('recreates a permission the server sends in both remove and update', async () => {
		await getPermissions();
		mockServerUpdate = [makeServerPermission('mute-user', ['owner'], '2026-01-02T00:00:00.000Z')];
		mockServerRemove = [makeRemovedPermission('mute-user')];

		await getPermissions();

		expect(mockLoggedErrors).toHaveLength(0);
		expect(storedRoles('mute-user')).toEqual(['owner']);
	});
});
