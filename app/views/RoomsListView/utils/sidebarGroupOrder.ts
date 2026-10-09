import { type ISidebarCategory } from '~/definitions';

export const FAVORITES_GROUP = 'Favorites';
export const TEAMS_GROUP = 'Teams';
export const DISCUSSIONS_GROUP = 'Discussions';
export const CHANNELS_GROUP = 'Channels';
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

export const getSectionsOrder = (adminSectionsOrder: string[] | undefined): readonly string[] =>
	adminSectionsOrder ? adminSectionsOrder.filter(key => SYSTEM_GROUPS.includes(key)) : SYSTEM_GROUPS;

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
	const storedIds = sidebarCategories
		.filter(category => !category.default || DEFAULT_GROUP_ORDER.includes(category._id))
		.map(category => category._id);
	const staticSectionsOrder = sectionsOrder.filter(key => DEFAULT_GROUP_ORDER.includes(key));
	return mergeWithSectionsOrder([...new Set(storedIds)], staticSectionsOrder);
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
