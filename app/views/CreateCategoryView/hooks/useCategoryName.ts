import { useState } from 'react';

import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { getCategoryNameError } from '../utils/categoryNameError';

export const useCategoryName = (initialName = '', editedCategoryId?: string) => {
	const [name, setName] = useState(initialName);
	const { customCategoryNames } = useSidebarCategories();
	const [existingNames] = useState(() =>
		[...customCategoryNames].filter(([id]) => id !== editedCategoryId).map(([, categoryName]) => categoryName)
	);
	const error = getCategoryNameError(name, existingNames);
	const isValid = name.trim().length > 0 && !error;
	return { name, setName, error, isValid };
};
