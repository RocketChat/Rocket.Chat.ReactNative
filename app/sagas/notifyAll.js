import { takeLatest } from 'redux-saga/effects';
import RocketChat from '../lib/rocketchat';
import * as types from '../actions/actionsTypes';
import log from '../utils/log';

const handleRequest = function handleRequest() {
	try {
		RocketChat.subscribeNotifyAll();
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(types.NOTIFY_ALL_REQUEST, handleRequest);
};
export default root;
