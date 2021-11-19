import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';

const getActivitiesIndicator = state => {
	if (isEmpty(state.usersActivity)) {
		return;
	}
	// The state.usersActivity can have only two keys, one for rid and other for tmid,
	// but there isn't specific order
	const [firstId, secondId] = Object.keys(state.usersActivity);
	const result = {};
	if (firstId) {
		const keys = Object.keys(state.usersActivity[firstId]);
		const username = keys[0];
		result[firstId] = { username, activity: state.usersActivity[firstId][username], count: keys.length };
	}

	if (secondId) {
		const keys = Object.keys(state.usersActivity[secondId]);
		const username = keys[0];
		result[secondId] = { username, activity: state.usersActivity[secondId][username], count: keys.length };
	}

	return result;
};

export const getActivitiesIndicatorSelector = createSelector([getActivitiesIndicator], activities => activities);
