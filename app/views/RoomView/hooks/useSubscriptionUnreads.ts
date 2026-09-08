import { useStore } from 'zustand';

import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { type TSubscriptionModel } from '../../../definitions';
import { type IUseSubscriptionUnreadsResult } from '../definitions';
import { type RoomStore } from '../definitions';

const EMPTY_UNREADS: string[] = [];

const getSubscriptionUnreads = (snapshot: RoomSnapshot, userId?: string): IUseSubscriptionUnreadsResult => {
	const room = getRoom(snapshot);
	if (!('id' in room)) {
		return {
			tunread: EMPTY_UNREADS,
			tunreadUser: EMPTY_UNREADS,
			tunreadGroup: EMPTY_UNREADS,
			isSelfDm: false,
			subscription: undefined
		};
	}
	return {
		tunread: room.tunread ?? EMPTY_UNREADS,
		tunreadUser: room.tunreadUser ?? EMPTY_UNREADS,
		tunreadGroup: room.tunreadGroup ?? EMPTY_UNREADS,
		isSelfDm: room.t === 'd' && !!userId && getUidDirectMessage(room) === userId,
		subscription: room as TSubscriptionModel
	};
};

export function useSubscriptionUnreads(roomStore: RoomStore, userId?: string): IUseSubscriptionUnreadsResult {
	const snapshot = useStore(roomStore, s => s.roomSnapshot);

	return getSubscriptionUnreads(snapshot, userId);
}
