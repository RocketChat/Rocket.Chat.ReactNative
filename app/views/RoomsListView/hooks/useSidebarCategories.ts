import { useMemo } from 'react';

import { type ISidebarCategory } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { getGroupOrder } from './sidebarGroupOrder';

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
	const groupOrder = useMemo(() => getGroupOrder(categories), [categories]);
	return { storedCategories, customCategoryNames, groupOrder };
};
