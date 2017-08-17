import { take, fork } from 'redux-saga/effects';
import hello from './hello';
import login from './login';

const root = function* root() {
	yield fork(hello);
	yield fork(login);
};
// Consider using takeEvery
export default root;


//
// import { take, fork } from 'redux-saga/effects';
// import 'babel-polyfill';
// import 'regenerator-runtime/runtime';
//
//
// const foreverAlone = function* foreverAlone() {
// 	yield take('FOI');
// 	console.log('FOIIIIIII');
// 	yield take('voa');
// 	console.log('o');
// };
//
// const root = function* root() {
// 	yield fork(foreverAlone);
// };
//
// export default root;
