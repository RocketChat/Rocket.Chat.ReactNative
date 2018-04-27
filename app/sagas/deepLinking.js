import { takeLatest, take, select, call, put } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { setServer, addServer } from '../actions/server';
import { logout } from '../actions/login';
import { goRoom, navigate } from '../containers/routes/NavigationService';
import database from '../lib/realm';

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);
	const server = yield select(state => state.server.server);
	const isAuthenticated = yield select(state => state.login.isAuthenticated);

	if (!isReady) {
		yield take(types.APP.READY);
	}

	// TODO: needs better test
	// if deep link is from same server
	if (server === `https://${ params.host }`) {
		// if user is already authenticated
		if (isAuthenticated) {
			// go to the room
			yield call(goRoom, { rid: params.rid });
		}
	} else { // if deep link is from a different server
		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', `https://${ params.host }`); // TODO: need better test
		if (servers.length) {
			// if server exists, select it
			yield put(setServer(servers[0].id));
			// TODO: wait for login and go to the room or login
		} else {
			// if server doesn't exists and user is authenticated
			if (isAuthenticated) {
				yield put(logout());
			}
			// add the new server
			yield put(addServer(`https://${ params.host }`));
			navigate('LoginSignup');
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
