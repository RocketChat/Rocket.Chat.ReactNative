import { put } from 'redux-saga/effects';

import { TOKEN_KEY } from '../lib/constants/keys';
import UserPreferences from '../lib/methods/userPreferences';
import { selectServerRequest } from '../actions/server';
import { type TServerModel } from '../definitions';

export const selectFirstLoggedServer = function* selectFirstLoggedServer(servers: TServerModel[]) {
	for (const server of servers) {
		if (UserPreferences.getString(`${TOKEN_KEY}-${server.id}`)) {
			yield put(selectServerRequest(server.id, server.version));
			return true;
		}
	}
	return false;
};
