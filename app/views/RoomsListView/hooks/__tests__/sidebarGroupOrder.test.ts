import { DEFAULT_GROUP_ORDER, getGroupOrder } from '../sidebarGroupOrder';

describe('getGroupOrder', () => {
	it('falls back to the default order when nothing is stored', () => {
		expect(getGroupOrder([])).toEqual(DEFAULT_GROUP_ORDER);
	});

	it('places a new custom category before the system groups', () => {
		expect(getGroupOrder([{ _id: 'work', name: 'Work' }])).toEqual(['work', ...DEFAULT_GROUP_ORDER]);
	});

	it('keeps a custom category where the user moved it among the system groups', () => {
		const order = getGroupOrder([
			{ _id: 'Favorites', name: 'Favorites', default: true },
			{ _id: 'Teams', name: 'Teams', default: true },
			{ _id: 'Discussions', name: 'Discussions', default: true },
			{ _id: 'Channels', name: 'Channels', default: true },
			{ _id: 'work', name: 'Work' }
		]);

		expect(order).toEqual(['Favorites', 'Teams', 'Discussions', 'Channels', 'work', 'Direct_Messages', 'Conversations']);
	});

	it('inserts a system group missing from storage before its first stored successor', () => {
		const order = getGroupOrder([
			{ _id: 'Channels', name: 'Channels', default: true },
			{ _id: 'work', name: 'Work' },
			{ _id: 'Favorites', name: 'Favorites', default: true }
		]);

		expect(order).toEqual(['Teams', 'Discussions', 'Channels', 'work', 'Favorites', 'Direct_Messages', 'Conversations']);
	});

	it('ignores dynamic groups and system groups that no longer exist', () => {
		const order = getGroupOrder([
			{ _id: 'Unread', name: 'Unread', default: true },
			{ _id: 'Drafts', name: 'Drafts', default: true },
			{ _id: 'work', name: 'Work' }
		]);

		expect(order).toEqual(['work', ...DEFAULT_GROUP_ORDER]);
	});
});
