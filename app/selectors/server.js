import { createSelector } from 'reselect';

const getServer = state => state.share.server || state.server.server;

export const getServerSelector = createSelector(
	[getServer],
	server => server
);
