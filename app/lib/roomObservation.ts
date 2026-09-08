import { type ISubscription, type TSubscriptionModel } from '../definitions/ISubscription';
import { type TRoomOrPreview } from '../definitions/TRoom';

export const roomObservedColumnByField = {
	f: 'f',
	ro: 'ro',
	blocked: 'blocked',
	blocker: 'blocker',
	archived: 'archived',
	tunread: 'tunread',
	tunreadUser: 'tunread_user',
	tunreadGroup: 'tunread_group',
	muted: 'muted',
	ignored: 'ignored',
	jitsiTimeout: 'jitsi_timeout',
	announcement: 'announcement',
	sysMes: 'sys_mes',
	topic: 'topic',
	name: 'name',
	fname: 'fname',
	roles: 'roles',
	bannerClosed: 'banner_closed',
	visitor: 'visitor',
	joinCodeRequired: 'join_code_required',
	teamMain: 'team_main',
	teamId: 'team_id',
	status: 'status',
	onHold: 'on_hold',
	t: 't',
	autoTranslate: 'auto_translate',
	autoTranslateLanguage: 'auto_translate_language',
	unmuted: 'unmuted',
	E2EKey: 'e2e_key',
	encrypted: 'encrypted',
	inviter: 'inviter'
} satisfies Partial<Record<keyof ISubscription, string>>;

export type TRoomObservedField = keyof typeof roomObservedColumnByField;
export type TRoomObservedFields = Partial<Pick<ISubscription, TRoomObservedField>>;

export const roomObservedFields = Object.keys(roomObservedColumnByField) as TRoomObservedField[];

export const roomObservedColumns = [...Object.values(roomObservedColumnByField), 'last_message'];

const jsonBackedFields = new Set<TRoomObservedField>([
	'roles',
	'tunread',
	'tunreadUser',
	'tunreadGroup',
	'muted',
	'unmuted',
	'ignored',
	'sysMes'
]);

export const roomSnapshotKey = Symbol('roomSnapshot');

export type RoomSnapshot = { readonly [roomSnapshotKey]: TRoomOrPreview };

export const createRoomSnapshot = (room: TRoomOrPreview): RoomSnapshot => ({ [roomSnapshotKey]: room });

export const getRoom = (snapshot: RoomSnapshot): TRoomOrPreview => snapshot[roomSnapshotKey];

export interface IRoomObservation {
	fields: TRoomObservedFields;
	snapshot: RoomSnapshot;
	subscribed: boolean;
	joined: boolean;
	lastMessageFromAgent: boolean;
}

export type TRoomObservationPatch = Partial<IRoomObservation>;

export const getRoomObservedFieldValues = (room: TRoomOrPreview): TRoomObservedFields =>
	Object.fromEntries(roomObservedFields.map(field => [field, (room as TSubscriptionModel)[field]])) as TRoomObservedFields;

const fieldChanged = (field: TRoomObservedField, previous: TRoomObservedFields, next: TSubscriptionModel): boolean =>
	jsonBackedFields.has(field) ? JSON.stringify(previous[field]) !== JSON.stringify(next[field]) : previous[field] !== next[field];

const isLastMessageFromAgent = (room: TSubscriptionModel): boolean =>
	room.t === 'l' && !!(room.lastMessage && !room.lastMessage.token && room.lastMessage.u);

export function getRoomObservationPatch(
	previous: IRoomObservation,
	next: TSubscriptionModel | undefined
): TRoomObservationPatch | null {
	if (!next) {
		const room = getRoom(previous.snapshot);
		return { subscribed: false, ...(room.t !== 'd' ? { joined: false } : {}) };
	}

	const roomChanged =
		next !== getRoom(previous.snapshot) || roomObservedFields.some(field => fieldChanged(field, previous.fields, next));
	const lastMessageFromAgent = isLastMessageFromAgent(next);

	if (!roomChanged && previous.subscribed && lastMessageFromAgent === previous.lastMessageFromAgent) {
		return null;
	}

	return {
		subscribed: true,
		joined: true,
		lastMessageFromAgent,
		...(roomChanged ? { snapshot: createRoomSnapshot(next), fields: getRoomObservedFieldValues(next) } : {})
	};
}
