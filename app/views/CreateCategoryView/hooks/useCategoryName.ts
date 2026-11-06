import { useState } from 'react';

import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { getCategoryNameError } from '../utils/categoryNameError';

export const useCategoryNameError = (name: string, editedCategoryId?: string) => {
	const { customCategoryNames } = useSidebarCategories();
	const existingNames = [...customCategoryNames]
		.filter(([id]) => id !== editedCategoryId)
		.map(([, categoryName]) => categoryName);
	const error = getCategoryNameError(name, existingNames);
	const isValid = name.trim().length > 0 && !error;
	return { error, isValid };
};

export const useCategoryName = (initialName = '', editedCategoryId?: string) => {
	const [name, setName] = useState(initialName);
	const { error, isValid } = useCategoryNameError(name, editedCategoryId);
	return { name, setName, error, isValid };
};
