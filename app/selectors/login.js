import { createSelector } from 'reselect';

const getUser = state => state.login.user || {};

export const getUserSelector = createSelector(
	[getUser],
	user => user
);
