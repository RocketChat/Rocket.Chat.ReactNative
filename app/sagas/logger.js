import { select, takeEvery } from 'redux-saga/effects';

const root = function* watchAndLog() {
	yield takeEvery('*', function* logger(action) {
		const state = yield select();
		const tmp = { ...state };
		delete tmp.settings;
		console.log('action', action);
		console.log('state after', tmp);
	});
};
export default root;
