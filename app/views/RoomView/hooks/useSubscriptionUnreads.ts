import { useShallow } from 'zustand/react/shallow';

import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { type TSubscriptionModel } from '../../../definitions';
import { useRoomStoreByRid } from '../stores/RoomStore';

export interface IUseSubscriptionUnreadsResult {
	tunread: string[];
	tunreadUser: string[];
	tunreadGroup: string[];
	isSelfDm: boolean;
	subscription?: TSubscriptionModel;
}

const EMPTY_UNREADS: string[] = [];

// The rid-keyed RoomStore already observes the subscription row on the tunread columns, so the
// thread-unread badges read it from there instead of opening a second observer on the same row.
export function useSubscriptionUnreads(rid?: string, userId?: string): IUseSubscriptionUnreadsResult {
	return useRoomStoreByRid(
		rid,
		useShallow(({ room }): IUseSubscriptionUnreadsResult => {
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
		})
	);
}
