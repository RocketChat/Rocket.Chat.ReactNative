import { type IListSelection } from '~/containers/List/ListContainer.ios';
import { type IStackItem } from './useStackItems';

export const ADMIN_SELECTION_TAG = 'sidebar-admin';

export const getSidebarSelection = (
	stackItems: IStackItem[],
	adminRoute: string | null,
	currentScreen: string | null
): IListSelection => {
	const selectedItem = stackItems.find(item => item.route && item.selected);
	const isAdminSelected = adminRoute !== null && currentScreen === adminRoute;
	return { selectedTag: selectedItem?.testID ?? (isAdminSelected ? ADMIN_SELECTION_TAG : null) };
};
