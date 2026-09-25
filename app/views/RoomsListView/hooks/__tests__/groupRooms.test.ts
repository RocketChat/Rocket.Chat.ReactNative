import { SubscriptionType, type TSubscriptionModel } from '~/definitions';
import { groupRooms } from '../groupRooms';
import { DEFAULT_GROUP_ORDER } from '../sidebarGroupOrder';

const room = (fields: Partial<TSubscriptionModel>) => ({ t: SubscriptionType.CHANNEL, ...fields }) as TSubscriptionModel;

const options = {
	groupOrder: ['work', 'empty', ...DEFAULT_GROUP_ORDER],
	customCategoryNames: new Map([
		['work', 'Work'],
		['empty', 'Empty']
	]),
	showFavorites: true,
	groupByType: false,
	hasChatsHeader: true
};

const layout = (chats: TSubscriptionModel[]) => chats.map(chat => (chat.separator ? `# ${chat.name ?? chat.rid}` : chat.rid));

describe('groupRooms', () => {
	it('puts a room in its category ahead of favorites and hides empty categories', () => {
		const chats = [
			room({ rid: 'general', f: true, category: 'work' }),
			room({ rid: 'random', f: true }),
			room({ rid: 'dm', t: SubscriptionType.DIRECT })
		];

		expect(layout(groupRooms(chats, options))).toEqual(['# Work', 'general', '# Favorites', 'random', '# Chats', 'dm']);
	});

	it('falls back to the default groups when the room category no longer exists', () => {
		const chats = [room({ rid: 'general', category: 'deleted' })];

		expect(layout(groupRooms(chats, options))).toEqual(['# Chats', 'general']);
	});

	it('lists rooms without a header when nothing else is grouped', () => {
		const chats = [room({ rid: 'general' })];

		expect(
			layout(groupRooms(chats, { ...options, customCategoryNames: new Map(), showFavorites: false, hasChatsHeader: false }))
		).toEqual(['general']);
	});
});
