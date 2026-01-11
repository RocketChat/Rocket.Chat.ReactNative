import { eventChannel } from 'redux-saga';
import { call, put, take, fork } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

import { emitter } from '../lib/methods/helpers';
import { roomsStoreLastVisited } from '../actions/rooms';
import UserPreferences from '../lib/methods/userPreferences';
import { LAST_VISITED_ROOM_ID_KEY, LAST_VISITED_ROOM_Name_KEY } from '../lib/constants/keys';

function createRoomVisitedChannel() {
	return eventChannel<{ rid: string; name: string }>(emit => {
		const handler = ({ rid, name }: { rid: string; name: string }) => {
			emit({ rid, name });
		};

		emitter.on('roomVisited', handler);
		return () => emitter.off('roomVisited', handler);
	});
}

function* watchRoomVisited(): SagaIterator {
	const channel = yield call(createRoomVisitedChannel);

	while (true) {
		const { rid, name } = yield take(channel);
		yield put(roomsStoreLastVisited(rid, name));

		UserPreferences.setString(LAST_VISITED_ROOM_ID_KEY, rid);
		UserPreferences.setString(LAST_VISITED_ROOM_Name_KEY, name);
	}
}

export default function* roomVisited(): SagaIterator {
	yield fork(watchRoomVisited);
}
