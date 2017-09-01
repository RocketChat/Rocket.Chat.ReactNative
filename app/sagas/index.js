import { fork, take } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import hello from './hello';
import login from './login';
import connect from './connect';
import rooms from './rooms';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';

const root = function* root() {
	yield fork(init);
	yield take(types.APP.READY);
	yield fork(createChannel);
	yield fork(hello);
	yield fork(rooms);
	yield fork(login);
	yield fork(connect);
	yield fork(messages);
	yield fork(selectServer);
};
// Consider using takeEvery
export default root;
