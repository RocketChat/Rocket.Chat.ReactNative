import { type TRoomUpdate, type TStateAttrsUpdate } from './definitions';

export const stateAttrsUpdate = [
	'joined',
	'lastSeen',
	'canAutoTranslate',
	'loading',
	'readOnly',
	'member',
	'canForwardGuest',
	'canReturnQueue',
	'canViewCannedResponse'
] as TStateAttrsUpdate[];

export const roomAttrsUpdate = [
	'f',
	'ro',
	'blocked',
	'blocker',
	'archived',
	'tunread',
	'muted',
	'ignored',
	'jitsiTimeout',
	'announcement',
	'sysMes',
	'topic',
	'name',
	'fname',
	'roles',
	'bannerClosed',
	'visitor',
	'joinCodeRequired',
	'teamMain',
	'teamId',
	'status',
	'lastMessage',
	'onHold',
	't',
	'autoTranslate',
	'autoTranslateLanguage',
	'unmuted',
	'E2EKey',
	'encrypted',
	'status',
	'inviter'
] as TRoomUpdate[];
