import { eventChannel } from 'redux-saga';
import { call, put, take, fork, select } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';

import { emitter } from '../lib/methods/helpers';
import { roomsStoreLastVisited } from '../actions/rooms';
import UserPreferences from '../lib/methods/userPreferences';
import { LAST_VISITED_ROOM_ID_KEY, LAST_VISITED_ROOM_NAME_KEY, RECENT_VISITED_ROOMS_KEY } from '../lib/constants/keys';
import { IApplicationState } from 'definitions';
import { IRooms } from 'reducers/rooms';

const getRecentRooms = (state: IApplicationState) => state.rooms.recentRooms;

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

		const recentRooms: IRooms['recentRooms'] = yield select(getRecentRooms);

		UserPreferences.setString(RECENT_VISITED_ROOMS_KEY, JSON.stringify(recentRooms));

		UserPreferences.setString(LAST_VISITED_ROOM_ID_KEY, rid);
		UserPreferences.setString(LAST_VISITED_ROOM_NAME_KEY, name);
	}
}

export default function* roomVisited(): SagaIterator {
	yield fork(watchRoomVisited);
}
