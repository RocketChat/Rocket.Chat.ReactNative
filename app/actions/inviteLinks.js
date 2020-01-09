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

export function inviteLinksCreate(rid) {
	return {
		type: types.INVITE_LINKS.CREATE,
		rid
	};
}

export function inviteLinksSetParams(days, maxUses) {
	return {
		type: types.INVITE_LINKS.SET_PARAMS,
		days,
		maxUses
	};
}

export function inviteLinksSetInviteUrl(url, expires) {
	return {
		type: types.INVITE_LINKS.SET_INVITE_URL,
		url,
		expires
	};
}
