import { SORT_PREFERENCES } from '../actions/actionsTypes';

const initialState = {
	sortBy: 'activity',
	groupByType: false,
	showFavorites: false,
	showUnread: false
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
