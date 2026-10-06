import { DEFAULT_GROUP_ORDER, getGroupOrder } from '~/views/RoomsListView/hooks/sidebarGroupOrder';
import { prependCategory } from '../useCreateCategory';

describe('prependCategory', () => {
	it('places the new category above every group the user ordered', () => {
		const storedCategories = [
			{ _id: 'Favorites', name: 'Favorites', default: true },
			{ _id: 'work', name: 'Work' }
		];
		const design = { _id: 'design', name: 'Design' };

		const sidebarCategories = prependCategory(storedCategories, getGroupOrder(storedCategories), design);

		expect(getGroupOrder(sidebarCategories)).toEqual(['design', 'Favorites', 'work', ...DEFAULT_GROUP_ORDER.slice(1)]);
	});

	it('keeps the stored custom categories and their names', () => {
		const storedCategories = [{ _id: 'work', name: 'Work' }];

		const sidebarCategories = prependCategory(storedCategories, getGroupOrder(storedCategories), {
			_id: 'design',
			name: 'Design'
		});

		expect(sidebarCategories.filter(category => !category.default)).toEqual([
			{ _id: 'design', name: 'Design' },
			{ _id: 'work', name: 'Work' }
		]);
	});
});
