import { TRoomUpdate, TStateAttrsUpdate } from './definitions';

export const stateAttrsUpdate = [
	'joined',
	'lastOpen',
	'reactionsModalVisible',
	'canAutoTranslate',
	'loading',
	'editing',
	'readOnly',
	'member',
	'canForwardGuest',
	'canReturnQueue',
	'canViewCannedResponse',
	'rightButtonsWidth'
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
	'encrypted'
] as TRoomUpdate[];
