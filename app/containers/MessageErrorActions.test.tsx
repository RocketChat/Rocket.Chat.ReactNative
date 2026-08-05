import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

import MessageErrorActions, { type IMessageErrorActions } from './MessageErrorActions';
import database from '../lib/database';
import log from '../lib/methods/helpers/log';
import { type TMessageModel } from '../definitions';

jest.mock('../lib/database', () => ({
	__esModule: true,
	default: { active: null }
}));

jest.mock('../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../lib/methods/sendMessage', () => ({
	resendMessage: jest.fn(() => Promise.resolve())
}));

const mockShowActionSheet = jest.fn();
jest.mock('./ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet })
}));

const tick = () => Promise.resolve();

/**
 * Minimal WatermelonDB stand-in that reproduces the invariants we care about:
 * - a record can only hold one prepared change at a time ("pending changes")
 * - batch() only accepts records whose prepared change is still pending
 * - batch() must run inside a writer
 * - write() serializes writers (the writer lock)
 */
class FakeModel {
	id: string;
	table: string;
	tcount: number | null = null;
	tlm: Date | null = null;
	_preparedState: string | null = null;
	_db: FakeDatabase;

	constructor(db: FakeDatabase, table: string, id: string, props: Partial<FakeModel> = {}) {
		this._db = db;
		this.table = table;
		this.id = id;
		Object.assign(this, props);
	}

	get _debugName() {
		return `${this.table}#${this.id}`;
	}

	prepareDestroyPermanently() {
		this._db.prepareLog.push({ record: this._debugName, op: 'destroyPermanently', insideWriter: this._db.insideWriter });
		if (this._preparedState) {
			throw new Error(`Cannot destroy permanently record with pending changes (${this._debugName})`);
		}
		this._preparedState = 'destroyPermanently';
		return this;
	}

	prepareUpdate(updater: (m: FakeModel) => void = () => {}) {
		this._db.prepareLog.push({ record: this._debugName, op: 'update', insideWriter: this._db.insideWriter });
		if (this._preparedState) {
			throw new Error(`Cannot update a record with pending changes (${this._debugName})`);
		}
		updater(this);
		this._preparedState = 'update';
		return this;
	}
}

class FakeDatabase {
	insideWriter = false;
	prepareLog: { record: string; op: string; insideWriter: boolean }[] = [];
	findLog: { record: string; insideWriter: boolean }[] = [];
	batches: string[][] = [];
	collections: Record<string, Map<string, FakeModel>> = {
		messages: new Map(),
		threads: new Map(),
		thread_messages: new Map()
	};
	_queue: Promise<unknown> = Promise.resolve();

	add(table: string, id: string, props: Partial<FakeModel> = {}) {
		const record = new FakeModel(this, table, id, props);
		this.collections[table].set(id, record);
		return record;
	}

	get(table: string) {
		return {
			find: async (id: string) => {
				this.findLog.push({ record: `${table}#${id}`, insideWriter: this.insideWriter });
				await tick();
				const record = this.collections[table].get(id);
				if (!record) {
					throw new Error(`Record ${table}#${id} not found`);
				}
				return record;
			}
		};
	}

	write<T>(work: () => Promise<T>): Promise<T> {
		const run = this._queue.then(async () => {
			this.insideWriter = true;
			try {
				return await work();
			} finally {
				this.insideWriter = false;
			}
		});
		this._queue = run.catch(() => {});
		return run;
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

const renderComponent = (tmid?: string) => {
	const ref = createRef<IMessageErrorActions>();
	render(<MessageErrorActions ref={ref} tmid={tmid} />);
	return ref;
};

const pressDelete = (ref: React.RefObject<IMessageErrorActions | null>, message: FakeModel) => {
	ref.current?.showMessageErrorActions(message as unknown as TMessageModel);
	const { options } = mockShowActionSheet.mock.calls[mockShowActionSheet.mock.calls.length - 1][0];
	const deleteOption = options.find((o: { icon: string }) => o.icon === 'delete');
	return deleteOption.onPress() as Promise<void>;
};

let db: FakeDatabase;

beforeEach(() => {
	jest.clearAllMocks();
	db = new FakeDatabase();
	(database as unknown as { active: FakeDatabase }).active = db;
});

describe('MessageErrorActions handleDelete', () => {
	it('deletes a failed thread message while another writer touches the same record', async () => {
		const threadMessage = db.add('thread_messages', 'msg-1');
		const message = db.add('messages', 'msg-1');
		db.add('messages', 'tmid-1', { tcount: 1, tlm: new Date() });
		db.add('threads', 'tmid-1');

		const ref = renderComponent('tmid-1');

		let concurrentWriter: Promise<unknown> = Promise.resolve();
		await act(async () => {
			const deleting = pressDelete(ref, threadMessage);
			// A saga writing to the very same record while the delete is in flight
			concurrentWriter = db.write(async () => {
				await db.batch([threadMessage.prepareUpdate(m => (m.tcount = 0))]);
			});
			await Promise.all([deleting, concurrentWriter]);
		});

		await expect(concurrentWriter).resolves.not.toThrow();
		expect(log).not.toHaveBeenCalled();

		// no prepare and no find escaped the writer lock
		expect(db.prepareLog.every(entry => entry.insideWriter)).toBe(true);
		expect(db.findLog.every(entry => entry.insideWriter)).toBe(true);

		// the whole tree was committed in a single batch
		expect(db.batches[0]).toEqual([
			'thread_messages#msg-1:destroyPermanently',
			'messages#msg-1:destroyPermanently',
			'messages#tmid-1:update',
			'threads#tmid-1:destroyPermanently'
		]);
		// the thread header lost its thread count and the thread record is gone
		expect(db.collections.messages.get('tmid-1')?.tcount).toBeNull();
		expect(db.collections.messages.get('tmid-1')?.tlm).toBeNull();
		expect(message._preparedState).toBeNull();
	});

	it('decrements the thread count when other messages remain', async () => {
		const threadMessage = db.add('thread_messages', 'msg-1');
		db.add('messages', 'tmid-1', { tcount: 3 });
		db.add('threads', 'tmid-1');

		const ref = renderComponent('tmid-1');
		await act(async () => {
			await pressDelete(ref, threadMessage);
		});

		expect(log).not.toHaveBeenCalled();
		expect(db.collections.messages.get('tmid-1')?.tcount).toBe(2);
		expect(db.batches[0]).toEqual(['thread_messages#msg-1:destroyPermanently', 'messages#tmid-1:update']);
	});

	it('destroys only the message on the non-thread branch', async () => {
		const message = db.add('messages', 'msg-1');

		const ref = renderComponent();
		await act(async () => {
			await pressDelete(ref, message);
		});

		expect(log).not.toHaveBeenCalled();
		expect(db.findLog).toEqual([]);
		expect(db.batches).toEqual([['messages#msg-1:destroyPermanently']]);
		expect(db.prepareLog).toEqual([{ record: 'messages#msg-1', op: 'destroyPermanently', insideWriter: true }]);
	});
});
