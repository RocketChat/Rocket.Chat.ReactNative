import { type ISidebarCategory } from '~/definitions';

export const FAVORITES_GROUP = 'Favorites';
export const TEAMS_GROUP = 'Teams';
export const DISCUSSIONS_GROUP = 'Discussions';
export const CHANNELS_GROUP = 'Channels';
export const DIRECT_MESSAGES_GROUP = 'Direct_Messages';
export const CONVERSATIONS_GROUP = 'Conversations';

export const DEFAULT_GROUP_ORDER: readonly string[] = [
	FAVORITES_GROUP,
	TEAMS_GROUP,
	DISCUSSIONS_GROUP,
	CHANNELS_GROUP,
	DIRECT_MESSAGES_GROUP,
	CONVERSATIONS_GROUP
];

const mergeWithDefaultOrder = (storedIds: string[]): string[] => {
	const merged = [...storedIds];
	DEFAULT_GROUP_ORDER.forEach((key, index) => {
		if (merged.includes(key)) {
			return;
		}
		const successorPosition = DEFAULT_GROUP_ORDER.slice(index + 1)
			.map(successor => merged.indexOf(successor))
			.find(position => position !== -1);
		merged.splice(successorPosition ?? merged.length, 0, key);
	});
	return merged;
};

export const getGroupOrder = (sidebarCategories: ISidebarCategory[]): string[] => {
	const storedIds = sidebarCategories
		.filter(category => !category.default || DEFAULT_GROUP_ORDER.includes(category._id))
		.map(category => category._id);
	return mergeWithDefaultOrder([...new Set(storedIds)]);
};

type GroupVisibility = {
	customCategoryNames: Map<string, string>;
	showFavorites: boolean;
	groupByType: boolean;
};

export const isVisibleGroup = (key: string, { customCategoryNames, showFavorites, groupByType }: GroupVisibility) => {
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

export const reorderGroups = (groupOrder: string[], reorderedGroups: string[]) => {
	const remainingGroups = [...reorderedGroups];
	return groupOrder.map(key => (reorderedGroups.includes(key) ? (remainingGroups.shift() ?? key) : key));
};

const DYNAMIC_GROUPS: readonly string[] = ['Incoming_Calls', 'Incoming_Livechats', 'Open_Livechats', 'On_Hold_Chats', 'Unread'];

export const SYSTEM_GROUPS: readonly string[] = [...DYNAMIC_GROUPS, ...DEFAULT_GROUP_ORDER];

export const toSidebarCategories = (storedCategories: ISidebarCategory[], groupOrder: string[]): ISidebarCategory[] => {
	const storedById = new Map(storedCategories.map(category => [category._id, category]));
	const storedDynamicGroups = storedCategories.map(category => category._id).filter(id => DYNAMIC_GROUPS.includes(id));
	const dynamicGroups = [...new Set([...storedDynamicGroups, ...DYNAMIC_GROUPS])];
	return [...dynamicGroups, ...groupOrder].map(id => storedById.get(id) ?? { _id: id, name: id, default: true });
};
