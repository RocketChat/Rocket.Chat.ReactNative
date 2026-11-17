import { getCategoryOptionIds, getCurrentCategoryId } from '../roomCategory';

const customCategoryNames = new Map([
	['design-id', 'Design'],
	['work-id', 'Work']
]);

describe('getCategoryOptionIds', () => {
	it('keeps custom categories and Favorites in sidebar order, dropping system groups', () => {
		const groupOrder = ['design-id', 'Favorites', 'Teams', 'work-id', 'Channels', 'Conversations'];
		expect(getCategoryOptionIds(groupOrder, customCategoryNames)).toEqual(['design-id', 'Favorites', 'work-id']);
	});
});

describe('getCurrentCategoryId', () => {
	it('returns the custom category the room belongs to, even when favorited', () => {
		expect(getCurrentCategoryId({ category: 'design-id', f: true }, customCategoryNames)).toBe('design-id');
	});

	it('falls back to Favorites when the room category no longer exists', () => {
		expect(getCurrentCategoryId({ category: 'deleted-id', f: true }, customCategoryNames)).toBe('Favorites');
	});

	it('returns undefined for a room outside any category', () => {
		expect(getCurrentCategoryId({ category: 'deleted-id', f: false }, customCategoryNames)).toBeUndefined();
	});
});
