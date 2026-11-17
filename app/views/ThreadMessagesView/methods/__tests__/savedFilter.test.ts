import UserPreferences from '~/lib/methods/userPreferences';
import { Filter } from '../../filters';
import { readSavedFilter, saveFilter } from '../savedFilter';

describe('savedFilter', () => {
	it('reads back the saved filter', () => {
		saveFilter(Filter.Unread);
		expect(readSavedFilter()).toBe(Filter.Unread);
	});

	it('falls back to All when the stored value is not a filter', () => {
		UserPreferences.setString('threadsFilter', 'Archived');
		expect(readSavedFilter()).toBe(Filter.All);
	});
});
