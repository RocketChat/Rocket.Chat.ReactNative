import { put } from 'redux-saga/effects';

import { TOKEN_KEY } from '../lib/constants/keys';
import UserPreferences from '../lib/methods/userPreferences';
import { selectServerRequest } from '../actions/server';

export const selectFirstLoggedServer = function* selectFirstLoggedServer(servers) {
	for (let i = 0; i < servers.length; i += 1) {
		const newServer = servers[i].id;
		if (UserPreferences.getString(`${TOKEN_KEY}-${newServer}`)) {
			yield put(selectServerRequest(newServer, newServer.version));
			return true;
		}
	}
	return false;
};
