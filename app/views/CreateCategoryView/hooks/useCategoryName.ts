import { useState } from 'react';

import { useSidebarCategories } from '~/views/RoomsListView/hooks/useSidebarCategories';
import { getCategoryNameError } from './categoryNameError';

export const useCategoryName = (initialName = '') => {
	const [name, setName] = useState(initialName);
	const { customCategoryNames } = useSidebarCategories();
	const [existingNames] = useState(() => [...customCategoryNames.values()]);
	const error = getCategoryNameError(name, existingNames);
	const isValid = name.trim().length > 0 && !error;
	return { name, setName, error, isValid };
};
