import { getSlashCommands } from '../getSlashCommands';

type StoredRecord = { id: string; description?: string };

const mockGet = jest.fn();
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockGet(...args)
	}
}));

jest.mock('../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockStored: StoredRecord[] = [];
const mockBatch = jest.fn();
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
	return {
		active: {
			get: () => collection,
			write: (writer: () => Promise<unknown>) => writer(),
			batch: (...args: unknown[]) => mockBatch(...args)
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

const batchedOperations = () =>
	mockBatch.mock.calls[0][0].map(({ operation, record }: any) => [operation, record.command ?? record.id]);

describe('getSlashCommands', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockStored.length = 0;
	});

	it('pages through commands.list until it has every command', async () => {
		const commands = [command(1), command(2), command(3), command(4), command(5)];
		servePages(commands, 2);

		await getSlashCommands();

		expect(mockGet.mock.calls.map(([, params]) => params.offset)).toEqual([0, 2, 4]);
		expect(batchedOperations()).toEqual(commands.map(({ command: name }) => ['create', name]));
	});

	it('updates listed commands and deletes the ones the server no longer lists', async () => {
		mockStored.push({ id: 'command1', description: 'outdated' }, { id: 'uninstalled' });
		servePages([command(1), command(2)], 1);

		await getSlashCommands();

		expect(batchedOperations()).toEqual([
			['create', 'command2'],
			['update', 'command1'],
			['destroy', 'uninstalled']
		]);
	});

	it('leaves the stored commands alone when a later page fails', async () => {
		mockStored.push({ id: 'command1' });
		mockGet
			.mockResolvedValueOnce({ success: true, appsLoaded: true, commands: [command(1)], offset: 0, count: 1, total: 2 })
			.mockRejectedValueOnce(new Error('network'));

		await getSlashCommands();

		expect(mockBatch).not.toHaveBeenCalled();
	});

	it('leaves the stored commands alone while the server is still loading apps', async () => {
		mockStored.push({ id: 'command1' });
		mockGet.mockResolvedValueOnce({ success: true, appsLoaded: false, commands: [], offset: 0, count: 0, total: 0 });

		await getSlashCommands();

		expect(mockBatch).not.toHaveBeenCalled();
	});
});
