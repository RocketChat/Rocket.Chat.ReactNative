import { type ReactElement, type ReactNode } from 'react';

import { MessageRoomProvider, type MessageRoomState } from '../../../containers/message/stores/MessageRoomStore';
import { type IRoomActions } from '../definitions';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

type IRoomMessageProviderProps = Omit<MessageRoomState, 'handlers'> & { children: ReactNode; roomActions: IRoomActions };

export const RoomMessageProvider = ({ children, roomActions, ...state }: IRoomMessageProviderProps): ReactElement => {
	const handlers = useRoomMessageHandlers({ tmid: state.tmid, ...roomActions });

	return (
		<MessageRoomProvider {...state} handlers={handlers}>
			{children}
		</MessageRoomProvider>
	);
};
