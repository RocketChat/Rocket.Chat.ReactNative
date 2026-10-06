import { useMemo } from 'react';

import { type ISidebarCategory } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { type CategoryUnreadOptions } from '../utils/groupRooms';
import { getGroupOrder } from '../utils/sidebarGroupOrder';

const CUSTOM_CATEGORIES_LICENSE_MODULE = 'experimental-enterprise-features';
const NO_CATEGORIES: ISidebarCategory[] = [];

export const useHasCustomCategoriesLicense = () =>
	useAppSelector(state => state.enterpriseModules.includes(CUSTOM_CATEGORIES_LICENSE_MODULE));

export const useSidebarCategories = () => {
	const hasCustomCategoriesLicense = useHasCustomCategoriesLicense();
	const storedCategories = useAppSelector(state => getUserSelector(state).sidebarCategories ?? NO_CATEGORIES);
	const categories = hasCustomCategoriesLicense ? storedCategories : NO_CATEGORIES;
	const customCategoryNames = useMemo(
		() => new Map(categories.filter(category => !category.default).map(category => [category._id, category.name])),
		[categories]
	);
	const categoryUnreadOptions = useMemo(
		() =>
			new Map<string, CategoryUnreadOptions>(
				categories
					.filter(category => !category.default)
					.map(category => [
						category._id,
						{ showUnreads: Boolean(category.showUnreads), keepUnreadsOnTop: Boolean(category.keepUnreadsOnTop) }
					])
			),
		[categories]
	);
	const groupOrder = useMemo(() => getGroupOrder(categories), [categories]);
	return { storedCategories, customCategoryNames, categoryUnreadOptions, groupOrder };
};
