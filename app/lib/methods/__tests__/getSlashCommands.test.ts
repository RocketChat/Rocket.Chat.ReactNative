import { getSlashCommands } from '../getSlashCommands';

type StoredRecord = { id: string; description?: string };
type BatchedOperation = { operation: 'create' | 'update' | 'destroy'; record: StoredRecord & { command?: string } };

const mockGet = jest.fn();
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockGet(...args)
	}
}));

const mockStored: StoredRecord[] = [];
const mockBatch = jest.fn();
const mockOtherWorkspaceBatch = jest.fn();
const mockActiveWorkspace = { current: 'signed-in' };
jest.mock('../../database', () => {
	const toRecord = (stored: StoredRecord) => ({
		...stored,
		prepareUpdate: (updater: (record: object) => void) => {
			const draft = { ...stored };
			updater(draft);
			return { operation: 'update', record: draft };
		},
		prepareDestroyPermanently: () => ({ operation: 'destroy', record: stored })
	});
	const collection = {
		schema: jest.requireActual('../../database/schema/app').default.tables.slash_commands,
		query: () => ({ fetch: () => Promise.resolve(mockStored.map(toRecord)) }),
		prepareCreate: (builder: (record: object) => void) => {
			const draft = {};
			builder(draft);
			return { operation: 'create', record: draft };
		}
	};
	const databaseWithBatch = (batchMock: () => jest.Mock) => ({
		get: () => collection,
		write: (writer: () => Promise<unknown>) => writer(),
		batch: (...args: unknown[]) => batchMock()(...args)
	});
	const signedInDatabase = databaseWithBatch(() => mockBatch);
	const otherDatabase = databaseWithBatch(() => mockOtherWorkspaceBatch);
	return {
		get active() {
			return mockActiveWorkspace.current === 'signed-in' ? signedInDatabase : otherDatabase;
		}
	};
});

const command = (index: number) => ({ command: `command${index}`, description: `description ${index}` });

const servePages = (commands: ReturnType<typeof command>[], pageSize: number) =>
	mockGet.mockImplementation((_endpoint: string, { offset }: { offset: number }) =>
		Promise.resolve({
			success: true,
			appsLoaded: true,
			commands: commands.slice(offset, offset + pageSize),
			offset,
			count: Math.min(pageSize, commands.length - offset),
			total: commands.length
		})
	);

const batchedOperations = (): BatchedOperation[] => mockBatch.mock.calls[0][0];

const batchedIds = () => batchedOperations().map(({ operation, record }) => `${operation} ${record.command ?? record.id}`);

const inAnyOrder = (ids: string[]) => [...ids].sort();

describe('getSlashCommands', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockStored.length = 0;
		mockActiveWorkspace.current = 'signed-in';
	});

	it('pages through commands.list until it has every command', async () => {
		const commands = [command(1), command(2), command(3), command(4), command(5)];
		servePages(commands, 2);

		await getSlashCommands();

		expect(mockGet.mock.calls.map(([, params]) => params.offset)).toEqual([0, 2, 4]);
		expect(inAnyOrder(batchedIds())).toEqual(inAnyOrder(commands.map(({ command: name }) => `create ${name}`)));
	});

	it('stops paging and saves what it has when the server returns an empty page before total', async () => {
		const listed = [command(1), command(2)];
		mockGet.mockImplementation((_endpoint: string, { offset }: { offset: number }) => {
			if (mockGet.mock.calls.length > 3) {
				return Promise.reject(new Error('kept requesting pages after an empty one'));
			}
			return Promise.resolve({
				success: true,
				appsLoaded: true,
				commands: listed.slice(offset, offset + 2),
				offset,
				count: 2,
				total: 5
			});
		});

		await getSlashCommands();

		expect(mockGet.mock.calls.map(([, params]) => params.offset)).toEqual([0, 2]);
		expect(inAnyOrder(batchedIds())).toEqual(['create command1', 'create command2']);
	});

	it('updates listed commands and deletes the ones the server no longer lists', async () => {
		mockStored.push({ id: 'command1', description: 'outdated' }, { id: 'uninstalled' });
		servePages([command(1), command(2)], 1);

		await getSlashCommands();

		expect(inAnyOrder(batchedIds())).toEqual(inAnyOrder(['create command2', 'update command1', 'destroy uninstalled']));
		const updated = batchedOperations().find(({ operation }) => operation === 'update');
		expect(updated?.record.description).toBe('description 1');
	});

	it('deletes every stored command when the server lists none', async () => {
		mockStored.push({ id: 'command1' });
		servePages([], 2);

		await getSlashCommands();

		expect(batchedIds()).toEqual(['destroy command1']);
	});

	it('saves into the workspace that was active when the sync started', async () => {
		mockGet.mockImplementationOnce(() => {
			mockActiveWorkspace.current = 'other';
			return Promise.resolve({ success: true, appsLoaded: true, commands: [command(1)], offset: 0, count: 1, total: 1 });
		});

		await getSlashCommands();

		expect(mockOtherWorkspaceBatch).not.toHaveBeenCalled();
		expect(batchedIds()).toEqual(['create command1']);
	});

	it('stops paging when the workspace changes between pages', async () => {
		mockStored.push({ id: 'command1' });
		mockGet.mockImplementationOnce(() => {
			mockActiveWorkspace.current = 'other';
			return Promise.resolve({ success: true, appsLoaded: true, commands: [command(1)], offset: 0, count: 1, total: 2 });
		});

		await getSlashCommands();

		expect(mockGet).toHaveBeenCalledTimes(1);
		expect(mockBatch).not.toHaveBeenCalled();
		expect(mockOtherWorkspaceBatch).not.toHaveBeenCalled();
	});

	it('leaves the stored commands alone when a later page fails', async () => {
		mockStored.push({ id: 'command1' });
		mockGet
			.mockResolvedValueOnce({ success: true, appsLoaded: true, commands: [command(1)], offset: 0, count: 1, total: 2 })
			.mockRejectedValueOnce(new Error('network'));

		await expect(getSlashCommands()).rejects.toThrow('network');

		expect(mockBatch).not.toHaveBeenCalled();
	});

	it.each([
		['the server is still loading apps', { success: true, appsLoaded: false, commands: [], offset: 0, count: 0, total: 0 }],
		['the server answers success: false', { success: false }]
	])('leaves the stored commands alone when %s', async (_case, answer) => {
		mockStored.push({ id: 'command1' });
		mockGet.mockResolvedValueOnce(answer);

		await getSlashCommands();

		expect(mockBatch).not.toHaveBeenCalled();
	});
});
