import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { type TSubscriptionModel } from '../../../definitions';
import { type IUseSubscriptionUnreadsResult } from '../definitions';
import { type RoomStore } from '../definitions';

const EMPTY_UNREADS: string[] = [];

export function useSubscriptionUnreads(roomStore: RoomStore, userId?: string): IUseSubscriptionUnreadsResult {
	return useStore(
		roomStore,
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
