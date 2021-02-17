import { put, takeLatest } from 'redux-saga/effects';
import lt from 'semver/functions/lt';
import orderBy from 'lodash/orderBy';
import reduxStore from '../lib/createStore';
import database from '../lib/database';
import log from '../utils/log';
import { PERMISSIONS } from '../actions/actionsTypes';
import { permissionsFailure, permissionsSuccess } from '../actions/permissions';

const getUpdatedSince = (allRecords) => {
	try {
		if (!allRecords.length) {
			return null;
		}
		const ordered = orderBy(allRecords.filter(item => item._updatedAt !== null), ['_updatedAt'], ['desc']);
		return ordered && ordered[0]._updatedAt.toISOString();
	} catch (e) {
		log(e);
	}
	return null;
};

const handlePermissionRequest = async function* handlePermissionRequest() {
	try {
		const serverVersion = reduxStore.getState().server.version;
		const db = database.active;
		const permissionsCollection = db.collections.get('permissions');
		const allRecords = await permissionsCollection.query().fetch();

		let result;

		// if server version is lower than 0.73.0, fetches from old api
		if (serverVersion && lt(serverVersion, '0.73.0')) {
			// RC 0.66.0
			result = await this.sdk.get('permissions.list');
			if (!result.success) {
				return null;
			}
		} else {
			const params = {};
			const updatedSince = await getUpdatedSince(allRecords);
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}
			// RC 0.73.0
			result = await this.sdk.get('permissions.listAll', params);

			if (!result.success) {
				return null;
			}
		}
		yield put(permissionsSuccess(result));
	} catch (e) {
		log(e);
		yield put(permissionsFailure(e));
	}
};

const root = function* root() {
	yield takeLatest(PERMISSIONS.REQUEST, handlePermissionRequest);
};
export default root;
