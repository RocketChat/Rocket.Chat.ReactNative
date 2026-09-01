import { useContext, useEffect, type ReactElement, type ReactNode } from 'react';

import { MessageRoomStoreContext } from '../../../containers/message/stores/MessageRoomStore';
import { type IUseRoomMessageHandlersParams } from '../definitions';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

// Published in the reactive tail (not FROZEN_KEYS): the bag closes over rid/room/navigation/tmid,
// which shift when a thread reuses the mount.
export const RoomMessageHandlersBridge = ({
	children,
	...handlerParams
}: { children: ReactNode } & IUseRoomMessageHandlersParams): ReactElement => {
	const store = useContext(MessageRoomStoreContext);
	const handlers = useRoomMessageHandlers(handlerParams);

	useEffect(() => {
		store?.setState({ handlers });
	}, [store, handlers]);

	return <>{children}</>;
};
