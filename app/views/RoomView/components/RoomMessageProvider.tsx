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
	rid,
	tmid,
	isThreadRoom,
	archived,
	broadcast,
	isReadReceiptEnabled,
	Message_GroupingPeriod,
	timeFormat,
	autoTranslateRoom,
	autoTranslateLanguage,
	jumpToMessage,
	closeEmojiAndAction,
	reactionInit,
	errorActionsShow
}: IRoomMessageProviderProps): ReactElement => {
	const handlers = useRoomMessageHandlers({ tmid, onThreadPress, onReactionPress, sendMessage });

	return (
		<MessageRoomProvider
			handlers={handlers}
			rid={rid}
			tmid={tmid}
			isThreadRoom={isThreadRoom}
			archived={archived}
			broadcast={broadcast}
			isReadReceiptEnabled={isReadReceiptEnabled}
			Message_GroupingPeriod={Message_GroupingPeriod}
			timeFormat={timeFormat}
			autoTranslateRoom={autoTranslateRoom}
			autoTranslateLanguage={autoTranslateLanguage}
			jumpToMessage={jumpToMessage}
			closeEmojiAndAction={closeEmojiAndAction}
			reactionInit={reactionInit}
			errorActionsShow={errorActionsShow}>
			{children}
		</MessageRoomProvider>
	);
};
