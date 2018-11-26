import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import {
	put, call, takeLatest, select, all
} from 'redux-saga/effects';
import { Navigation } from 'react-native-navigation';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { serverFinishAdd } from '../actions/server';
import {
	registerRequest,
	loginFailure,
	loginSuccess,
	setUsernameRequest,
	setUsernameSuccess,
	forgotPasswordSuccess,
	forgotPasswordFailure,
	setUser
} from '../actions/login';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';

const getServer = state => state.server.server;
const getToken = state => state.login.token;

const loginCall = args => RocketChat.loginWithPassword(args);
const registerCall = args => RocketChat.register(args);
const setUsernameCall = args => RocketChat.setUsername(args);
const loginSuccessCall = () => RocketChat.loginSuccess();
const logoutCall = args => RocketChat.logout(args);
const forgotPasswordCall = args => RocketChat.forgotPassword(args);

const handleLoginRequest = function* handleLoginRequest({ credentials }) {
	try {
		const result = yield call(loginCall, credentials);
		yield put(loginSuccess(result));
	} catch (error) {
		alert(error);
		yield put(loginFailure(error));
	}
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	console.warn(user)
	// TODO: one api call
	// // call /me only one time
	// try {
	// 	if (!user.username) {
	// 		// // get me from api
	// 		// let me = await SDK.api.get('me');
	// 		// // if server didn't found username
	// 		// if (!me.username) {
	// 		// 	// search username from credentials (sent during registerSubmit)
	// 		// 	const { username } = reduxStore.getState().login.credentials;
	// 		// 	if (username) {
	// 		// 		// set username
	// 		// 		await RocketChat.setUsername({ username });
	// 		// 		me = { ...me, username };
	// 		// 	}
	// 		// }
	// 		// user = { ...user, ...me };
	// 	}
	// } catch (e) {
	// 	log('SDK.loginSuccess set username', e);
	// }

	// try {
	// 	if (user.username) {
	// 		const userInfo = await SDK.api.get('users.info', { userId: user.id });
	// 		user = { ...user, ...userInfo.user };
	// 	}

	// 	RocketChat.registerPushToken(user.id);
	// 	// reduxStore.dispatch(setUser(user));
	// 	// reduxStore.dispatch(loginSuccess(user));
	// 	// this.ddp.subscribe('userData');
	// } catch (e) {
	// 	log('SDK.loginSuccess', e);
	// }




	// RocketChat.registerPushToken(user.userId);
	// yield put(setUser(user.me));

	const adding = yield select(state => state.server.adding);
	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.authToken);

	if (user.me && !user.me.username) {
		return yield put(appStart('setUsername'));
	}

	if (adding) {
		yield put(serverFinishAdd());
		yield Navigation.dismissAllModals();
	} else {
		yield put(appStart('inside'));
	}
	const server = yield select(getServer);
	RocketChat.loginSuccess({ user: user.me });
	// RocketChat.start({ server, user: user.me });

	// try {
	// 	RocketChat.getRooms();
	// } catch (error) {
	// 	console.log("​RocketChat.getRooms() -> error", error);
	// }

	// try {
	// 	const oauth = yield RocketChat.sdk.get('roles.list')
	// 	console.log("​connect -> oauth", oauth);
	// } catch (error) {
	// 	console.log("​}catch -> error", error);
		
	// }




	// try {
	// 	const user = yield select(getUser);
	// 	const adding = yield select(state => state.server.adding);
	// 	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.token);

	// 	if (!user.username) {
	// 		return yield put(appStart('setUsername'));
	// 	}

	// 	if (adding) {
	// 		yield put(serverFinishAdd());
	// 		yield Navigation.dismissAllModals();
	// 	} else {
	// 		yield put(appStart('inside'));
	// 	}
	// } catch (e) {
	// 	log('handleLoginSuccess', e);
	// }
};

const handleRegisterSubmit = function* handleRegisterSubmit({ credentials }) {
	yield put(registerRequest(credentials));
};

const handleRegisterRequest = function* handleRegisterRequest({ credentials }) {
	try {
		yield call(registerCall, { credentials });
		yield call(loginCall, {
			username: credentials.email,
			password: credentials.pass
		});
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleSetUsernameSubmit = function* handleSetUsernameSubmit({ credentials }) {
	yield put(setUsernameRequest(credentials));
};

const handleSetUsernameRequest = function* handleSetUsernameRequest({ credentials }) {
	try {
		yield call(setUsernameCall, credentials);
		yield put(setUsernameSuccess());
		yield call(loginSuccessCall);
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleLogout = function* handleLogout() {
	const server = yield select(getServer);
	if (server) {
		try {
			yield put(appStart('outside'));
			yield call(logoutCall, { server });
		} catch (e) {
			log('handleLogout', e);
		}
	}
};

const handleForgotPasswordRequest = function* handleForgotPasswordRequest({ email }) {
	try {
		yield call(forgotPasswordCall, email);
		yield put(forgotPasswordSuccess());
	} catch (err) {
		yield put(forgotPasswordFailure(err));
	}
};

const handleSetUser = function* handleSetUser({ user }) {
	yield delay(2000);
	const [server, token] = yield all([select(getServer), select(getToken)]);
	if (user.language) {
		I18n.locale = user.language;
	}
	yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify({ ...user, token }));
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, handleLoginSuccess);
	yield takeLatest(types.LOGIN.REGISTER_REQUEST, handleRegisterRequest);
	yield takeLatest(types.LOGIN.REGISTER_SUBMIT, handleRegisterSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_SUBMIT, handleSetUsernameSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_REQUEST, handleSetUsernameRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.FORGOT_PASSWORD.REQUEST, handleForgotPasswordRequest);
	yield takeLatest(types.USER.SET, handleSetUser);
};
export default root;
