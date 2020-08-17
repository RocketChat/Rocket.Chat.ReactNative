import { takeLatest } from 'redux-saga/effects';
import RocketChat from '../lib/rocketchat';
import * as types from '../actions/actionsTypes';

const handleRequest = function* handleRequest() {
	yield	RocketChat.subscribeNotifyAll();
};

const root = function* root() {
	yield takeLatest(types.NOTIFY_ALL_REQUEST, handleRequest);
};
export default root;
