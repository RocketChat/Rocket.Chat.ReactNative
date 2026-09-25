import { type TSubscriptionModel } from '~/definitions';
import {
	CHANNELS_GROUP,
	CONVERSATIONS_GROUP,
	DIRECT_MESSAGES_GROUP,
	DISCUSSIONS_GROUP,
	FAVORITES_GROUP,
	TEAMS_GROUP
} from './sidebarGroupOrder';

const CHATS_HEADER = 'Chats';

export const addRoomsGroup = (data: TSubscriptionModel[], header: string, allData: TSubscriptionModel[], title?: string) => {
	if (data.length > 0) {
		if (header) {
			allData.push({ rid: header, separator: true, name: title } as TSubscriptionModel);
		}
		allData = allData.concat(data);
	}
	return allData;
};

const getRoomGroup = (subscription: TSubscriptionModel, groups: Map<string, TSubscriptionModel[]>) => {
	if (subscription.category && groups.has(subscription.category)) {
		return subscription.category;
	}
	if (subscription.f && groups.has(FAVORITES_GROUP)) {
		return FAVORITES_GROUP;
	}
	if (subscription.teamMain && groups.has(TEAMS_GROUP)) {
		return TEAMS_GROUP;
	}
	if (subscription.prid && groups.has(DISCUSSIONS_GROUP)) {
		return DISCUSSIONS_GROUP;
	}
	if ((subscription.t === 'c' || subscription.t === 'p') && groups.has(CHANNELS_GROUP)) {
		return CHANNELS_GROUP;
	}
	if (subscription.t === 'd' && groups.has(DIRECT_MESSAGES_GROUP)) {
		return DIRECT_MESSAGES_GROUP;
	}
	if (groups.has(CONVERSATIONS_GROUP)) {
		return CONVERSATIONS_GROUP;
	}
	return undefined;
};

type GroupRoomsOptions = {
	groupOrder: string[];
	customCategoryNames: Map<string, string>;
	showFavorites: boolean;
	groupByType: boolean;
	hasChatsHeader: boolean;
};

export const groupRooms = (
	chats: TSubscriptionModel[],
	{ groupOrder, customCategoryNames, showFavorites, groupByType, hasChatsHeader }: GroupRoomsOptions
) => {
	const isVisibleGroup = (key: string) => {
		switch (key) {
			case FAVORITES_GROUP:
				return showFavorites;
			case TEAMS_GROUP:
			case DISCUSSIONS_GROUP:
			case CHANNELS_GROUP:
			case DIRECT_MESSAGES_GROUP:
				return groupByType;
			case CONVERSATIONS_GROUP:
				return !groupByType;
			default:
				return customCategoryNames.has(key);
		}
	};
	const visibleGroups = groupOrder.filter(isVisibleGroup);
	const groups = new Map(visibleGroups.map(key => [key, [] as TSubscriptionModel[]]));
	chats.forEach(subscription => {
		const group = getRoomGroup(subscription, groups);
		if (group) {
			groups.get(group)?.push(subscription);
		}
	});

	let groupedChats = [] as TSubscriptionModel[];
	visibleGroups.forEach(key => {
		const header = key === CONVERSATIONS_GROUP ? (hasChatsHeader ? CHATS_HEADER : '') : key;
		groupedChats = addRoomsGroup(groups.get(key) ?? [], header, groupedChats, customCategoryNames.get(key));
	});
	return groupedChats;
};
