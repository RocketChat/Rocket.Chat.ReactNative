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
