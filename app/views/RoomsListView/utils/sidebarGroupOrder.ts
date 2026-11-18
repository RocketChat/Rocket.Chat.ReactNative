import { type ISidebarCategory } from '~/definitions/IUser';

export const FAVORITES_GROUP = 'Favorites';
export const TEAMS_GROUP = 'Teams';
export const DISCUSSIONS_GROUP = 'Discussions';
export const CHANNELS_GROUP = 'Channels';
export const TEAMS_AND_CHANNELS_GROUP = 'Teams_and_channels';
export const DIRECT_MESSAGES_GROUP = 'Direct_Messages';
export const CONVERSATIONS_GROUP = 'Conversations';
export const UNREAD_GROUP = 'Unread';
export const OMNICHANNEL_IN_PROGRESS_GROUP = 'Open_Livechats';
export const OMNICHANNEL_ON_HOLD_GROUP = 'On_Hold_Chats';

export const DEFAULT_GROUP_ORDER: readonly string[] = [
	FAVORITES_GROUP,
	TEAMS_GROUP,
	DISCUSSIONS_GROUP,
	CHANNELS_GROUP,
	DIRECT_MESSAGES_GROUP,
	CONVERSATIONS_GROUP
];

const DYNAMIC_GROUPS: readonly string[] = [
	'Incoming_Calls',
	'Incoming_Livechats',
	OMNICHANNEL_IN_PROGRESS_GROUP,
	OMNICHANNEL_ON_HOLD_GROUP,
	UNREAD_GROUP
];

export const SYSTEM_GROUPS: readonly string[] = [...DYNAMIC_GROUPS, ...DEFAULT_GROUP_ORDER];

const STATIC_GROUPS: readonly string[] = [...DEFAULT_GROUP_ORDER, TEAMS_AND_CHANNELS_GROUP];

const KNOWN_GROUPS: readonly string[] = [...DYNAMIC_GROUPS, ...STATIC_GROUPS];

type SectionsOrderOptions = {
	mergeTeamsAndChannels?: boolean;
	keepConversations?: boolean;
};

export const getSectionsOrder = (
	adminSectionsOrder: string[] | undefined,
	{ mergeTeamsAndChannels = false, keepConversations = false }: SectionsOrderOptions = {}
): readonly string[] => {
	const sectionsOrder = adminSectionsOrder ? adminSectionsOrder.filter(key => KNOWN_GROUPS.includes(key)) : [...SYSTEM_GROUPS];
	if (mergeTeamsAndChannels && !sectionsOrder.includes(TEAMS_AND_CHANNELS_GROUP)) {
		const channelsIndex = sectionsOrder.indexOf(CHANNELS_GROUP);
		sectionsOrder.splice(channelsIndex === -1 ? sectionsOrder.length : channelsIndex + 1, 0, TEAMS_AND_CHANNELS_GROUP);
	}
	if (keepConversations && !sectionsOrder.includes(CONVERSATIONS_GROUP)) {
		sectionsOrder.push(CONVERSATIONS_GROUP);
	}
	return sectionsOrder;
};

const mergeWithSectionsOrder = (storedIds: string[], staticSectionsOrder: readonly string[]): string[] => {
	const merged = [...storedIds];
	staticSectionsOrder.forEach((key, index) => {
		if (merged.includes(key)) {
			return;
		}
		const successorPosition = staticSectionsOrder
			.slice(index + 1)
			.map(successor => merged.indexOf(successor))
			.find(position => position !== -1);
		merged.splice(successorPosition ?? merged.length, 0, key);
	});
	return merged;
};

export const getGroupOrder = (sidebarCategories: ISidebarCategory[], sectionsOrder: readonly string[]): string[] => {
	const storedIds = sidebarCategories.filter(category => !DYNAMIC_GROUPS.includes(category._id)).map(category => category._id);
	const staticSectionsOrder = sectionsOrder.filter(key => STATIC_GROUPS.includes(key));
	return mergeWithSectionsOrder([...new Set(storedIds)], staticSectionsOrder);
};

export type GroupVisibility = {
	customCategoryNames: Map<string, string>;
	showFavorites: boolean;
	groupByType: boolean;
	mergeTeamsAndChannels: boolean;
	groupUnlistedInConversations: boolean;
};

export const isVisibleGroup = (
	key: string,
	{ customCategoryNames, showFavorites, groupByType, mergeTeamsAndChannels, groupUnlistedInConversations }: GroupVisibility
) => {
	switch (key) {
		case FAVORITES_GROUP:
			return showFavorites;
		case TEAMS_GROUP:
		case CHANNELS_GROUP:
			return groupByType && !mergeTeamsAndChannels;
		case TEAMS_AND_CHANNELS_GROUP:
			return groupByType && mergeTeamsAndChannels;
		case DISCUSSIONS_GROUP:
		case DIRECT_MESSAGES_GROUP:
			return groupByType;
		case CONVERSATIONS_GROUP:
			return !groupByType || groupUnlistedInConversations;
		default:
			return customCategoryNames.has(key);
	}
};

export const reorderGroups = (groupOrder: string[], reorderedGroups: string[]) => {
	const remainingGroups = [...reorderedGroups];
	return groupOrder.map(key => (reorderedGroups.includes(key) ? (remainingGroups.shift() ?? key) : key));
};

export const toSidebarCategories = (
	storedCategories: ISidebarCategory[],
	groupOrder: string[],
	sectionsOrder: readonly string[]
): ISidebarCategory[] => {
	const storedById = new Map(storedCategories.map(category => [category._id, category]));
	const storedDynamicGroups = storedCategories.map(category => category._id).filter(id => DYNAMIC_GROUPS.includes(id));
	const dynamicSections = sectionsOrder.filter(key => DYNAMIC_GROUPS.includes(key));
	const dynamicGroups = [...new Set([...storedDynamicGroups, ...dynamicSections])];
	return [...dynamicGroups, ...groupOrder].map(id => storedById.get(id) ?? { _id: id, name: id, default: true });
};
