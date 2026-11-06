import UserPreferences from '~/lib/methods/userPreferences';
import { Filter } from '../filters';

const THREADS_FILTER = 'threadsFilter';

const isFilter = (value: string | null): value is Filter => Object.values<string | null>(Filter).includes(value);

export const readSavedFilter = (): Filter => {
	const savedFilter = UserPreferences.getString(THREADS_FILTER);
	return isFilter(savedFilter) ? savedFilter : Filter.All;
};

export const saveFilter = (filter: Filter) => UserPreferences.setString(THREADS_FILTER, filter);
