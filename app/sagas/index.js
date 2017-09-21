import { all } from 'redux-saga/effects';
import hello from './hello';
import login from './login';
import connect from './connect';
import rooms from './rooms';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';

const root = function* root() {
	yield all([
		init(),
		createChannel(),
		hello(),
		rooms(),
		login(),
		connect(),
		messages(),
		selectServer()
	]);
};
// Consider using takeEvery
export default root;
