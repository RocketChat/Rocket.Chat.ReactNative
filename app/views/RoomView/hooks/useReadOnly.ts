import { useContext } from 'react';

import { type ISubscription } from '../../../definitions';
import { isReadOnlySync } from '../../../lib/methods/helpers/isReadOnly';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { RoomStoreContext, useRoomWithUpdateFromStore } from '../stores/RoomStoreContext';
import { type RoomStore } from '../definitions';

export const useReadOnlyForStore = (store: RoomStore): boolean => {
	const room = useRoomWithUpdateFromStore(store);
	const user = useAppSelector(getUserSelector);
	const postReadOnlyPermission = useAppSelector(state => state.permissions['post-readonly']);

	if (!('id' in room)) {
		return false;
	}

	return isReadOnlySync(room as Partial<ISubscription>, user.username as string, postReadOnlyPermission, user.roles ?? []);
};

// The orchestrator holds its `roomStore` instance directly and renders the `RoomStoreContext.Provider`
// itself, so it cannot consume that same context (it isn't its own descendant) — it must pass the
// store explicitly. Descendants (e.g. RoomMessageActions) call this with no arguments and rely on context.
export const useReadOnly = (roomStoreOverride?: RoomStore): boolean => {
	const contextStore = useContext(RoomStoreContext);
	const store = roomStoreOverride ?? contextStore;
	if (!store) {
		throw new Error('useReadOnly must be used within a RoomStoreContext.Provider, or given a roomStore explicitly');
	}

	return useReadOnlyForStore(store);
};
