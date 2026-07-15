import { useContext } from 'react';
import { useStore } from 'zustand';

import { type ISubscription } from '../../../definitions';
import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { RoomStoreContext } from '../stores/RoomStoreContext';
import { type RoomStore } from '../definitions';

// The orchestrator holds its `roomStore` instance directly and renders the `RoomStoreContext.Provider`
// itself, so it cannot consume that same context (it isn't its own descendant) — it must pass the
// store explicitly. Descendants (e.g. RoomMessageActions) call this with no arguments and rely on context.
export const useReadOnly = (roomStoreOverride?: RoomStore): boolean => {
	'use memo';

	const contextStore = useContext(RoomStoreContext);
	const store = roomStoreOverride ?? contextStore;
	if (!store) {
		throw new Error('useReadOnly must be used within a RoomStoreContext.Provider, or given a roomStore explicitly');
	}

	const room = useStore(store, s => s.room);
	useStore(store, s => s.roomUpdate);

	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	if (!('id' in room)) {
		return false;
	}

	return isReadOnlySync(room as Partial<ISubscription>, user.username as string, postReadOnlyPermission, user.roles ?? []);
};
