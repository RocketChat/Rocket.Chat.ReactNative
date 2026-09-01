import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

import MessageErrorActions, { type IMessageErrorActions } from './MessageErrorActions';
import database from '../lib/database';
import log from '../lib/methods/helpers/log';
import { type TMessageModel } from '../definitions';
import { FakeDatabase, type FakeModel } from '../lib/database/__tests__/mockedWatermelonDB';

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
