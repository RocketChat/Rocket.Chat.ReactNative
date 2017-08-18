import { fork } from 'redux-saga/effects';
import hello from './hello';
import login from './login';
import connect from './connect';
import rooms from './rooms';
import messages from './messages';
import selectServer from './selectServer';

const root = function* root() {
	yield fork(hello);
	yield fork(rooms);
	yield fork(login);
	yield fork(connect);
	yield fork(messages);
	yield fork(selectServer);
};
// Consider using takeEvery
export default root;
