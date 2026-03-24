import { type ISubscription } from '../../definitions';

export interface IRoomFederated extends ISubscription {
	federated: true;
}

export interface IRoomNativeFederated extends IRoomFederated {
	federation: {
		version: number;
		mrid: string;
		origin: string;
	};
}

export const isRoomFederated = (room: ISubscription): room is IRoomFederated =>
	'federated' in room && (room as any).federated === true;

export const isRoomNativeFederated = (room: ISubscription): room is IRoomNativeFederated =>
	isRoomFederated(room) && 'federation' in room && !!room.federation;
