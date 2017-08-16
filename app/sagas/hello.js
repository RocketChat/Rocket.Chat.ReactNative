import { take, fork } from 'redux-saga/effects';
import 'babel-polyfill';
import 'regenerator-runtime/runtime';


const foreverAlone = function* foreverAlone() {
	yield take('cagado');
	console.log('foi cagado');
	yield take('voa');
	console.log('o');
};

const root = function* root() {
	yield fork(foreverAlone);
};

export default root;
