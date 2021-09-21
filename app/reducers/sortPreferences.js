import { SORT_PREFERENCES } from '../actions/actionsTypes';
import { DISPLAY_MODE_EXPANDED } from '../constants/constantDisplayMode';

const initialState = {
	sortBy: 'activity',
	groupByType: false,
	showFavorites: false,
	showUnread: false,
	showAvatar: true,
	displayMode: DISPLAY_MODE_EXPANDED
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
