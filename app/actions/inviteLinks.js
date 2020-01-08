import * as types from './actionsTypes';

export function inviteLinksInit(token) {
	return {
		type: types.INVITE_LINKS.INIT,
		token
	};
}

export function inviteLinksFinish() {
	return {
		type: types.INVITE_LINKS.FINISH
	};
}
