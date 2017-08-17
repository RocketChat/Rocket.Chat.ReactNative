import { fork } from 'redux-saga/effects';
import hello from './hello';
import login from './login';
import connect from './connect';

const root = function* root() {
	yield fork(hello);
	yield fork(login);
	yield fork(connect);
};
// Consider using takeEvery
export default root;
