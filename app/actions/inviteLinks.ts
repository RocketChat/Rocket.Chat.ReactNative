import { Action } from 'redux';

import { TInvite } from '../reducers/inviteLinks';
import { INVITE_LINKS } from './actionsTypes';

interface IInviteLinksGeneric extends Action {
	token: string;
}

interface IInviteLinksCreate extends Action {
	rid: string;
}

interface IInviteLinksSetInvite extends Action {
	invite: TInvite;
}

type TParams = Record<string, any>;

interface IInviteLinksSetParams extends Action {
	params: TParams;
}

export type TActionInviteLinks = IInviteLinksGeneric & IInviteLinksCreate & IInviteLinksSetInvite & IInviteLinksSetParams;

export const inviteLinksSetToken = (token: string): IInviteLinksGeneric => ({
	type: INVITE_LINKS.SET_TOKEN,
	token
});

export const inviteLinksRequest = (token: string): IInviteLinksGeneric => ({
	type: INVITE_LINKS.REQUEST,
	token
});

export const inviteLinksSuccess = (): Action => ({
	type: INVITE_LINKS.SUCCESS
});

export const inviteLinksFailure = (): Action => ({
	type: INVITE_LINKS.FAILURE
});

export const inviteLinksClear = (): Action => ({
	type: INVITE_LINKS.CLEAR
});

export const inviteLinksCreate = (rid: string): IInviteLinksCreate => ({
	type: INVITE_LINKS.CREATE,
	rid
});

export const inviteLinksSetParams = (params: TParams): IInviteLinksSetParams => ({
	type: INVITE_LINKS.SET_PARAMS,
	params
});

export const inviteLinksSetInvite = (invite: TInvite): IInviteLinksSetInvite => ({
	type: INVITE_LINKS.SET_INVITE,
	invite
});
