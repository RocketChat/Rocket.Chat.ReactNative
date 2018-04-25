import { takeLatest, take, select, call } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { goRoom } from '../containers/routes/NavigationService';

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);
	if (!isReady) {
		yield take(types.APP.READY);
	}

	const { rid } = params;
	try {
		yield call(goRoom, { rid });
	} catch (error) {
		console.warn(error)
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
