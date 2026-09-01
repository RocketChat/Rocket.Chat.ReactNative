import { type ReactElement, type ReactNode } from 'react';

import { MessageRoomProvider, type MessageRoomState } from '../../../containers/message/stores/MessageRoomStore';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

type IRoomMessageProviderProps = Omit<MessageRoomState, 'handlers'> & { children: ReactNode };

export const RoomMessageProvider = ({ children, ...state }: IRoomMessageProviderProps): ReactElement => {
	const handlers = useRoomMessageHandlers(state.tmid);

	return (
		<MessageRoomProvider {...state} handlers={handlers}>
			{children}
		</MessageRoomProvider>
	);
};
