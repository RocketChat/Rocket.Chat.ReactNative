import { fork } from 'redux-saga/effects';
import hello from './hello';
import login from './login';
import connect from './connect';
import rooms from './rooms';
import logger from './logger';
import messages from './messages';

const root = function* root() {
	yield fork(hello);
	yield fork(rooms);
	yield fork(login);
	yield fork(connect);
	yield fork(logger);
	yield fork(messages);
};
// Consider using takeEvery
export default root;
