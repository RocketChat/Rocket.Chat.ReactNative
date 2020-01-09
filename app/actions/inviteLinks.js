import * as types from './actionsTypes';

export function inviteLinksSetToken(token) {
	return {
		type: types.INVITE_LINKS.SET_TOKEN,
		token
	};
}

export function inviteLinksRequest(token) {
	return {
		type: types.INVITE_LINKS.REQUEST,
		token
	};
}

export function inviteLinksSuccess() {
	return {
		type: types.INVITE_LINKS.SUCCESS
	};
}

export function inviteLinksFailure() {
	return {
		type: types.INVITE_LINKS.FAILURE
	};
}

export function inviteLinksClear() {
	return {
		type: types.INVITE_LINKS.CLEAR
	};
}


export function inviteLinksCreate(rid) {
	return {
		type: types.INVITE_LINKS.CREATE,
		rid
	};
}

export function inviteLinksSetParams(params) {
	return {
		type: types.INVITE_LINKS.SET_PARAMS,
		params
	};
}

export function inviteLinksSetInvite(invite) {
	return {
		type: types.INVITE_LINKS.SET_INVITE,
		invite
	};
}
