import * as types from './actionsTypes';

export function openRoomFiles(rid, limit) {
	return {
		type: types.ROOM_FILES.OPEN,
		rid,
		limit
	};
}

export function readyRoomFiles() {
	return {
		type: types.ROOM_FILES.READY
	};
}

export function closeRoomFiles() {
	return {
		type: types.ROOM_FILES.CLOSE
	};
}

export function roomFilesReceived(messages) {
	return {
		type: types.ROOM_FILES.MESSAGES_RECEIVED,
		messages
	};
}
