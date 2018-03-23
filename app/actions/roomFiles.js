import * as types from './actionsTypes';

export function openRoomFiles(rid) {
	return {
		type: types.ROOM_FILES.OPEN,
		rid
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
