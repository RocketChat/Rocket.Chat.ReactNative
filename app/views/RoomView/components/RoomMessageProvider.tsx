import { type ReactElement, type ReactNode } from 'react';

import { MessageRoomProvider, type MessageRoomState } from '../../../containers/message/stores/MessageRoomStore';
import { type IRoomMessageHandlersInput } from '../definitions';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

type IRoomMessageProviderProps = Omit<MessageRoomState, 'handlers'> &
	Pick<IRoomMessageHandlersInput, 'onThreadPress' | 'onReactionPress' | 'sendMessage'> & { children: ReactNode };

export const RoomMessageProvider = ({
	children,
	onThreadPress,
	onReactionPress,
	sendMessage,
	...state
}: IRoomMessageProviderProps): ReactElement => {
	const handlers = useRoomMessageHandlers({ tmid: state.tmid, onThreadPress, onReactionPress, sendMessage });

	return (
		<MessageRoomProvider {...state} handlers={handlers}>
			{children}
		</MessageRoomProvider>
	);
};
