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
	groupByType: true,
	isOmnichannelAgent: false
};

const layout = (chats: TSubscriptionModel[]) => chats.map(chat => (chat.separator ? `# ${chat.name ?? chat.rid}` : chat.rid));

describe('groupRooms', () => {
	it('puts a room in its category ahead of favorites and hides empty categories', () => {
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

		expect(layout(buildRoomList(chats, options))).toEqual(['# Channels', 'general']);
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
});
