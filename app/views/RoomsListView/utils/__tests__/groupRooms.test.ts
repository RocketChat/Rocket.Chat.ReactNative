import { SubscriptionType, type TSubscriptionModel } from '~/definitions';
import { buildRoomList, categoryIdOfHeader, roomsInSection } from '../groupRooms';
import { DEFAULT_GROUP_ORDER, SYSTEM_GROUPS } from '../sidebarGroupOrder';

const room = (fields: Partial<TSubscriptionModel>) => ({ t: SubscriptionType.CHANNEL, ...fields }) as TSubscriptionModel;

const options = {
	groupOrder: ['work', ...DEFAULT_GROUP_ORDER],
	customCategoryNames: new Map([['work', 'Work']]),
	categoryUnreadOptions: new Map(),
	sectionsOrder: SYSTEM_GROUPS,
	showUnread: false,
	showFavorites: true,
	groupByType: true,
	isOmnichannelAgent: false,
	collapsedGroups: new Set<string>()
};

const layout = (chats: TSubscriptionModel[]) => chats.map(chat => (chat.separator ? `# ${chat.name ?? chat.rid}` : chat.rid));

describe('groupRooms', () => {
	it('puts a room in its category ahead of favorites and hides empty system groups', () => {
		const chats = [
			room({ rid: 'general', f: true, category: 'work' }),
			room({ rid: 'random', f: true }),
			room({ rid: 'dm', t: SubscriptionType.DIRECT })
		];

		expect(layout(buildRoomList(chats, options))).toEqual([
			'# Work',
			'general',
			'# Favorites',
			'random',
			'# Direct_Messages',
			'dm'
		]);
	});

	it('keeps an empty custom category as an empty header', () => {
		const chats = [room({ rid: 'general', category: 'work' })];
		const roomList = buildRoomList(chats, {
			...options,
			groupOrder: ['work', 'empty', ...DEFAULT_GROUP_ORDER],
			customCategoryNames: new Map([
				['work', 'Work'],
				['empty', 'Empty']
			])
		});

		expect(layout(roomList)).toEqual(['# Work', 'general', '# Empty']);
		expect(roomList.filter(chat => chat.separator).map(header => header.empty)).toEqual([false, true]);
	});

	it('hides custom categories and type groups when categories are off', () => {
		const chats = [
			room({ rid: 'general', category: 'work' }),
			room({ rid: 'random', f: true, category: 'work' }),
			room({ rid: 'dm', t: SubscriptionType.DIRECT })
		];

		expect(layout(buildRoomList(chats, { ...options, groupByType: false }))).toEqual([
			'# Favorites',
			'random',
			'# Chats',
			'general',
			'dm'
		]);
	});

	it('lists rooms in a flat list when categories, favorites and unread are off', () => {
		const chats = [room({ rid: 'general', category: 'work' }), room({ rid: 'dm', t: SubscriptionType.DIRECT })];

		expect(layout(buildRoomList(chats, { ...options, groupByType: false, showFavorites: false }))).toEqual(['general', 'dm']);
	});

	it('falls back to the default groups when the room category no longer exists', () => {
		const chats = [room({ rid: 'general', category: 'deleted' })];

		expect(layout(buildRoomList(chats, options))).toEqual(['# Work', '# Channels', 'general']);
	});

	it('lists rooms without a header when nothing else is grouped', () => {
		const chats = [room({ rid: 'general' })];

		expect(
			layout(buildRoomList(chats, { ...options, customCategoryNames: new Map(), showFavorites: false, groupByType: false }))
		).toEqual(['general']);
	});

	it('places omnichannel rooms before unread rooms and regular groups', () => {
		const chats = [
			room({ rid: 'open-livechat', t: SubscriptionType.OMNICHANNEL, onHold: false }),
			room({ rid: 'unread', alert: true }),
			room({ rid: 'on-hold-livechat', t: SubscriptionType.OMNICHANNEL, onHold: true }),
			room({ rid: 'regular' })
		];

		expect(
			layout(
				buildRoomList(chats, {
					...options,
					showUnread: true,
					showFavorites: false,
					groupByType: false,
					isOmnichannelAgent: true
				})
			)
		).toEqual([
			'# Open_Livechats',
			'open-livechat',
			'# On_hold_Livechats',
			'on-hold-livechat',
			'# Unread',
			'unread',
			'# Chats',
			'regular'
		]);
	});

	it('keeps the header of a collapsed group and hides its rooms', () => {
		const chats = [room({ rid: 'general', category: 'work' }), room({ rid: 'dm', t: SubscriptionType.DIRECT })];

		expect(layout(buildRoomList(chats, { ...options, collapsedGroups: new Set(['work']) }))).toEqual([
			'# Work',
			'# Direct_Messages',
			'dm'
		]);
	});

	it('gives a collapsed header the badge totals of its rooms, skipping rooms that hide unread status', () => {
		const chats = [
			room({ rid: 'general', category: 'work', unread: 3, userMentions: 1 }),
			room({ rid: 'random', category: 'work', unread: 4, groupMentions: 2 }),
			room({ rid: 'thread-only', category: 'work', unread: 0, tunread: ['thread'], tunreadUser: ['thread'] }),
			room({ rid: 'muted', category: 'work', unread: 10, hideUnreadStatus: true })
		];

		const [header] = buildRoomList(chats, { ...options, collapsedGroups: new Set(['work']) });

		expect(header).toMatchObject({
			unread: 8,
			userMentions: 1,
			groupMentions: 2,
			tunread: ['thread'],
			tunreadUser: ['thread']
		});
	});

	it('lists unread rooms first in a category that keeps unread rooms on top', () => {
		const chats = [
			room({ rid: 'read', category: 'work' }),
			room({ rid: 'unread', category: 'work', unread: 1 }),
			room({ rid: 'alert', category: 'work', alert: true })
		];
		const categoryUnreadOptions = new Map([['work', { showUnreads: false, keepUnreadsOnTop: true }]]);

		expect(layout(buildRoomList(chats, { ...options, categoryUnreadOptions }))).toEqual(['# Work', 'unread', 'alert', 'read']);
	});

	it('keeps unread rooms visible in a collapsed category that always displays them, badging only the hidden ones', () => {
		const chats = [
			room({ rid: 'read', category: 'work', groupMentions: 1 }),
			room({ rid: 'unread', category: 'work', unread: 2, userMentions: 1 })
		];
		const categoryUnreadOptions = new Map([['work', { showUnreads: true, keepUnreadsOnTop: false }]]);

		const roomList = buildRoomList(chats, { ...options, categoryUnreadOptions, collapsedGroups: new Set(['work']) });

		expect(layout(roomList)).toEqual(['# Work', 'unread']);
		expect(roomList[0]).toMatchObject({ unread: 0, userMentions: 0, groupMentions: 1 });
	});

	it('treats a room with only unread threads as unread', () => {
		const chats = [room({ rid: 'read', category: 'work' }), room({ rid: 'thread-only', category: 'work', tunread: ['thread'] })];
		const categoryUnreadOptions = new Map([['work', { showUnreads: true, keepUnreadsOnTop: true }]]);

		expect(layout(buildRoomList(chats, { ...options, categoryUnreadOptions }))).toEqual(['# Work', 'thread-only', 'read']);
		expect(layout(buildRoomList(chats, { ...options, categoryUnreadOptions, collapsedGroups: new Set(['work']) }))).toEqual([
			'# Work',
			'thread-only'
		]);
	});

	it('counts a room flagged only by an alert as one unread on its collapsed header', () => {
		const chats = [room({ rid: 'alert', category: 'work', alert: true })];

		const [header] = buildRoomList(chats, { ...options, collapsedGroups: new Set(['work']) });

		expect(header).toMatchObject({ unread: 1 });
	});
	it('applies the unread toggles of a system category, as web stores them', () => {
		const chats = [room({ rid: 'read', f: true }), room({ rid: 'unread', f: true, unread: 1 })];
		const categoryUnreadOptions = new Map([['Favorites', { showUnreads: true, keepUnreadsOnTop: true }]]);

		expect(layout(buildRoomList(chats, { ...options, categoryUnreadOptions }))).toEqual([
			'# Work',
			'# Favorites',
			'unread',
			'read'
		]);
		expect(layout(buildRoomList(chats, { ...options, categoryUnreadOptions, collapsedGroups: new Set(['Favorites']) }))).toEqual([
			'# Work',
			'# Favorites',
			'unread'
		]);
	});

	it('keeps unread rooms visible in the collapsed Unread section that always displays them', () => {
		const chats = [room({ rid: 'unread', unread: 1 })];
		const categoryUnreadOptions = new Map([['Unread', { showUnreads: true, keepUnreadsOnTop: false }]]);

		expect(
			layout(buildRoomList(chats, { ...options, showUnread: true, categoryUnreadOptions, collapsedGroups: new Set(['Unread']) }))
		).toEqual(['# Unread', 'unread', '# Work']);
	});

	it('leaves out the sections the admin removed from the sections order', () => {
		const chats = [room({ rid: 'unread', unread: 1 }), room({ rid: 'livechat', t: SubscriptionType.OMNICHANNEL })];
		const sectionsOrder = SYSTEM_GROUPS.filter(key => key !== 'Unread' && key !== 'Open_Livechats');

		expect(
			layout(buildRoomList(chats, { ...options, sectionsOrder, showUnread: true, groupByType: false, isOmnichannelAgent: true }))
		).toEqual(['# Chats', 'unread']);
	});
});

describe('categoryIdOfHeader', () => {
	it('maps the list headers that differ from their stored category ids', () => {
		expect(categoryIdOfHeader('Chats')).toBe('Conversations');
		expect(categoryIdOfHeader('On_hold_Livechats')).toBe('On_Hold_Chats');
		expect(categoryIdOfHeader('Favorites')).toBe('Favorites');
	});
});

describe('roomsInSection', () => {
	const chats = [
		room({ rid: 'general', category: 'work' }),
		room({ rid: 'random', f: true }),
		room({ rid: 'dm', t: SubscriptionType.DIRECT })
	];
	const roomList = buildRoomList(chats, options);

	it('returns the rooms between a header and the next one', () => {
		expect(layout(roomsInSection(roomList, 'Favorites'))).toEqual(['random']);
	});

	it('returns the rooms of the last section', () => {
		expect(layout(roomsInSection(roomList, 'Direct_Messages'))).toEqual(['dm']);
	});

	it('returns nothing for a section that is not listed', () => {
		expect(roomsInSection(roomList, 'empty')).toEqual([]);
	});
});
