// WatermelonDB stand-ins: pending changes, batch inside a writer, and the serialized writer lock.

export const tick = () => Promise.resolve();

// Let every already-queued microtask/promise chain settle.
export const flush = () => new Promise(resolve => setImmediate(resolve));

export const deferred = () => {
	let resolve: () => void = () => undefined;
	const promise = new Promise<void>(r => {
		resolve = r;
	});
	return { promise, resolve };
};

export interface IFakeRecord {
	_preparedState: string | null;
	prepareUpdate: (updater?: (record: any) => void) => any;
	prepareDestroyPermanently: () => any;
	[key: string]: any;
}

export interface ILogEntry {
	record: string;
	op: string;
	insideWriter: boolean;
}

interface IFakeModelHost {
	insideWriter: boolean;
	prepareLog: ILogEntry[];
}

export class FakeModel {
	id: string;
	table: string;
	_preparedState: string | null = null;
	_db?: IFakeModelHost;
	[key: string]: any;

	constructor(table: string, id: string, props: Record<string, any> = {}, db?: IFakeModelHost) {
		this._db = db;
		this.table = table;
		this.id = id;
		Object.assign(this, props);
	}

	get _debugName() {
		return `${this.table}#${this.id}`;
	}

	_log(op: string) {
		this._db?.prepareLog.push({ record: this._debugName, op, insideWriter: this._db.insideWriter });
	}

	prepareDestroyPermanently() {
		this._log('destroyPermanently');
		if (this._preparedState) {
			throw new Error(`Cannot destroy permanently record with pending changes (${this._debugName})`);
		}
		this._preparedState = 'destroyPermanently';
		return this;
	}

	prepareUpdate(updater: (m: any) => void = () => {}) {
		this._log('update');
		if (this._preparedState) {
			throw new Error(`Cannot update a record with pending changes (${this._debugName})`);
		}
		updater(this);
		this._preparedState = 'update';
		return this;
	}
}

// A record identified by a `table#id` debug name, for tests that don't need a whole FakeDatabase.
export const makeFakeRecord = (debugName: string, fields: Record<string, any> = {}): IFakeRecord => {
	const [table, id] = debugName.split('#');
	return new FakeModel(table, id, fields) as unknown as IFakeRecord;
};

// Serialized writer lock, like WatermelonDB's.
export const createWriterLock = () => {
	let queue: Promise<unknown> = Promise.resolve();
	return <T,>(work: () => Promise<T>): Promise<T> => {
		const run = queue.then(() => work());
		queue = run.catch(() => undefined);
		return run;
	};
};

// db.batch commits prepared records, clearing their pending state (like the real writer).
export const commitPreparedRecords = (...args: any[]) => {
	args.flat().forEach((item: any) => {
		if (item && typeof item === 'object' && '_preparedState' in item) {
			item._preparedState = null;
		}
	});
	return Promise.resolve(undefined);
};

export const createBatchMock = () => jest.fn(commitPreparedRecords);

// Whether the mocked `log` received a WatermelonDB "pending changes" error.
export const loggedPendingChanges = (log: unknown) =>
	(log as jest.Mock).mock.calls.some(([error]) => /pending changes/.test(error?.message ?? ''));

// An instrumented `database.active` that records what each writer prepared, found and batched.
export class FakeDatabase {
	insideWriter = false;
	prepareLog: ILogEntry[] = [];
	findLog: { record: string; insideWriter: boolean }[] = [];
	batches: string[][] = [];
	collections: Record<string, Map<string, FakeModel>> = {
		messages: new Map(),
		threads: new Map(),
		thread_messages: new Map()
	};
	_queue = createWriterLock();

	add(table: string, id: string, props: Record<string, any> = {}) {
		const record = new FakeModel(table, id, props, this);
		if (!this.collections[table]) {
			this.collections[table] = new Map();
		}
		this.collections[table].set(id, record);
		return record;
	}

	get(table: string) {
		return {
			find: async (id: string) => {
				this.findLog.push({ record: `${table}#${id}`, insideWriter: this.insideWriter });
				await tick();
				const record = this.collections[table]?.get(id);
				if (!record) {
					throw new Error(`Record ${table}#${id} not found`);
				}
				return record;
			}
		};
	}

	write<T>(work: () => Promise<T>): Promise<T> {
		return this._queue(async () => {
			this.insideWriter = true;
			try {
				return await work();
			} finally {
				this.insideWriter = false;
			}
		});
	}

	async batch(records: FakeModel[]) {
		if (!this.insideWriter) {
			throw new Error('Database.batch() can only be called from inside of a Writer');
		}
		await tick();
		this.batches.push(records.map(r => `${r._debugName}:${r._preparedState}`));
		records.forEach(record => {
			if (!record._preparedState) {
				throw new Error("Cannot batch a record that doesn't have a prepared create/update/delete");
			}
			record._preparedState = null;
		});
	}
}
