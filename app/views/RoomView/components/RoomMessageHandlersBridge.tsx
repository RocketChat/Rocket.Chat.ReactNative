import { useContext, useEffect, type ReactElement, type ReactNode } from 'react';

import { MessageRoomStoreContext } from '../../../containers/message/stores/MessageRoomStore';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

// Produces the message handler bag once inside RoomView (below RoomStoreContext + MessageActionStore)
// and publishes it into MessageRoomStore. Leaves read it through fine-grained selectors, so the
// container -> views import inversion is gone. Published in the reactive tail (not FROZEN_KEYS): the
// bag closes over rid/room/roomUserId/navigation/tmid, which shift when a thread reuses the mount.
export const RoomMessageHandlersBridge = ({ children }: { children: ReactNode }): ReactElement => {
	const store = useContext(MessageRoomStoreContext);
	const handlers = useRoomMessageHandlers();

	useEffect(() => {
		store?.setState({ handlers });
	}, [store, handlers]);

	return <>{children}</>;
};
