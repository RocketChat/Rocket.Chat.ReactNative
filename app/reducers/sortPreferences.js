import { SORT_PREFERENCES } from '../actions/actionsTypes';
import { DisplayMode, SortBy } from '../constants/constantDisplayMode';

const initialState = {
	sortBy: SortBy.Activity,
	groupByType: false,
	showFavorites: false,
	showUnread: false,
	showAvatar: true,
	displayMode: DisplayMode.Expanded
};

export default (state = initialState, action) => {
	switch (action.type) {
		case SORT_PREFERENCES.SET_ALL:
			return {
				...state,
				...action.preferences
			};
		case SORT_PREFERENCES.SET:
			return {
				...state,
				...action.preference
			};
		default:
			return state;
	}
};
