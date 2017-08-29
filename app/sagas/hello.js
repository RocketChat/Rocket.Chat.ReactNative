import { take, fork } from 'redux-saga/effects';

const foreverAlone = function* foreverAlone() {
	yield take('FOI');
	console.log('FOIIIIIII');
	yield take('voa');
	console.log('o');
};

const root = function* root() {
	yield fork(foreverAlone);
};

export default root;
