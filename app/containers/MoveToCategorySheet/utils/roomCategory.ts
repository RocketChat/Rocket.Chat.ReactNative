import { FAVORITES_GROUP } from '~/views/RoomsListView/utils/sidebarGroupOrder';

export type TRoomPlacement = {
	rid: string;
	category?: string;
	f?: boolean;
};

export const getCategoryOptionIds = (groupOrder: string[], customCategoryNames: Map<string, string>) =>
	groupOrder.filter(groupId => groupId === FAVORITES_GROUP || customCategoryNames.has(groupId));

export const getCurrentCategoryId = ({ category, f }: Omit<TRoomPlacement, 'rid'>, customCategoryNames: Map<string, string>) => {
	if (category && customCategoryNames.has(category)) {
		return category;
	}
	return f ? FAVORITES_GROUP : undefined;
};
