import { type ISidebarCategory } from '~/definitions';

export const patchCategory = (
	categories: ISidebarCategory[],
	categoryId: string,
	patch: Partial<Omit<ISidebarCategory, '_id'>>
): ISidebarCategory[] => categories.map(category => (category._id === categoryId ? { ...category, ...patch } : category));

export const removeCategory = (categories: ISidebarCategory[], categoryId: string): ISidebarCategory[] =>
	categories.filter(category => category._id !== categoryId);

export const getRoomChanges = (initialRoomIds: string[], selectedRoomIds: string[]) => ({
	addedRoomIds: selectedRoomIds.filter(rid => !initialRoomIds.includes(rid)),
	removedRoomIds: initialRoomIds.filter(rid => !selectedRoomIds.includes(rid))
});
