import { useShallow } from 'zustand/react/shallow';
import { useStore } from 'zustand';

import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { type IUseSubscriptionUnreadsResult } from '../definitions';
import { type RoomStore } from '../definitions';
import { fromSubscription } from '../stores/RoomStoreContext';

const EMPTY_UNREADS: string[] = [];

export function useSubscriptionUnreads(roomStore: RoomStore, userId?: string): IUseSubscriptionUnreadsResult {
	return useStore(
		roomStore,
		useShallow(
			(s): IUseSubscriptionUnreadsResult => ({
				tunread: fromSubscription(room => room.tunread ?? EMPTY_UNREADS, EMPTY_UNREADS)(s),
				tunreadUser: fromSubscription(room => room.tunreadUser ?? EMPTY_UNREADS, EMPTY_UNREADS)(s),
				tunreadGroup: fromSubscription(room => room.tunreadGroup ?? EMPTY_UNREADS, EMPTY_UNREADS)(s),
				isSelfDm: fromSubscription(room => room.t === 'd' && !!userId && getUidDirectMessage(room) === userId, false)(s)
			})
		)
	);
}
