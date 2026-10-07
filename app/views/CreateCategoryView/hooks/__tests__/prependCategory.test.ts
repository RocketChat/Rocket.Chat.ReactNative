import { DEFAULT_GROUP_ORDER, getGroupOrder, SYSTEM_GROUPS } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { prependCategory } from '../useCreateCategory';

describe('prependCategory', () => {
	it('places the new category above every group the user ordered', () => {
		const storedCategories = [
			{ _id: 'Favorites', name: 'Favorites', default: true },
			{ _id: 'work', name: 'Work' }
		];
		const design = { _id: 'design', name: 'Design' };

		const sidebarCategories = prependCategory(
			storedCategories,
			getGroupOrder(storedCategories, SYSTEM_GROUPS),
			SYSTEM_GROUPS,
			design
		);

		expect(getGroupOrder(sidebarCategories, SYSTEM_GROUPS)).toEqual([
			'design',
			'Favorites',
			'work',
			...DEFAULT_GROUP_ORDER.slice(1)
		]);
	});

	it('keeps the stored custom categories and their names', () => {
		const storedCategories = [{ _id: 'work', name: 'Work' }];

		const sidebarCategories = prependCategory(storedCategories, getGroupOrder(storedCategories, SYSTEM_GROUPS), SYSTEM_GROUPS, {
			_id: 'design',
			name: 'Design'
		});

		expect(sidebarCategories.filter(category => !category.default)).toEqual([
			{ _id: 'design', name: 'Design' },
			{ _id: 'work', name: 'Work' }
		]);
	});

	it('replaces a category saved by an earlier attempt instead of adding a second one', () => {
		const storedCategories = [
			{ _id: 'design', name: 'Desing' },
			{ _id: 'work', name: 'Work' }
		];

		const sidebarCategories = prependCategory(storedCategories, getGroupOrder(storedCategories, SYSTEM_GROUPS), SYSTEM_GROUPS, {
			_id: 'design',
			name: 'Design'
		});

		expect(sidebarCategories.filter(category => !category.default)).toEqual([
			{ _id: 'design', name: 'Design' },
			{ _id: 'work', name: 'Work' }
		]);
	});
});
