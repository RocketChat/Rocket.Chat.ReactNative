import { SubscriptionType, type TSubscriptionModel } from '~/definitions';
import { buildRoomList } from '../groupRooms';
import { DEFAULT_GROUP_ORDER } from '../sidebarGroupOrder';

const room = (fields: Partial<TSubscriptionModel>) => ({ t: SubscriptionType.CHANNEL, ...fields }) as TSubscriptionModel;

const options = {
	groupOrder: ['work', 'empty', ...DEFAULT_GROUP_ORDER],
	customCategoryNames: new Map([
		['work', 'Work'],
		['empty', 'Empty']
	]),
	showUnread: false,
	showFavorites: true,
	groupByType: false,
	isOmnichannelAgent: false,
	collapsedGroups: new Set<string>()
};

const layout = (chats: TSubscriptionModel[]) => chats.map(chat => (chat.separator ? `# ${chat.name ?? chat.rid}` : chat.rid));

describe('groupRooms', () => {
	it('puts a room in its category ahead of favorites and hides empty categories', () => {
		const chats = [
			room({ rid: 'general', f: true, category: 'work' }),
			room({ rid: 'random', f: true }),
			room({ rid: 'dm', t: SubscriptionType.DIRECT })
		];

		expect(layout(buildRoomList(chats, options))).toEqual(['# Work', 'general', '# Favorites', 'random', '# Chats', 'dm']);
	});

	it('falls back to the default groups when the room category no longer exists', () => {
		const chats = [room({ rid: 'general', category: 'deleted' })];

		expect(layout(buildRoomList(chats, options))).toEqual(['# Chats', 'general']);
	});

	it('lists rooms without a header when nothing else is grouped', () => {
		const chats = [room({ rid: 'general' })];

		expect(layout(buildRoomList(chats, { ...options, customCategoryNames: new Map(), showFavorites: false }))).toEqual([
			'general'
		]);
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

		expect(layout(buildRoomList(chats, { ...options, collapsedGroups: new Set(['work']) }))).toEqual(['# Work', '# Chats', 'dm']);
	});

	it('marks a collapsed header with the badge totals of its rooms, skipping rooms that hide unread status', () => {
		const chats = [
			room({ rid: 'general', category: 'work', unread: 3, userMentions: 1 }),
			room({ rid: 'random', category: 'work', unread: 4, groupMentions: 2 }),
			room({ rid: 'thread-only', category: 'work', unread: 0, tunread: ['thread'], tunreadUser: ['thread'] }),
			room({ rid: 'muted', category: 'work', unread: 10, hideUnreadStatus: true })
		];

		const [header] = buildRoomList(chats, { ...options, collapsedGroups: new Set(['work']) });

		expect(header).toMatchObject({
			collapsed: true,
			sectionRoomCount: 4,
			unread: 8,
			userMentions: 1,
			groupMentions: 2,
			tunread: ['thread'],
			tunreadUser: ['thread']
		});
	});
});
