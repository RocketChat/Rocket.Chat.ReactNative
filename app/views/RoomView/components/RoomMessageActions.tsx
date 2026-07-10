import { type RefObject } from 'react';

import MessageActions, { type IMessageActions, type IMessageActionsProps } from '../../../containers/MessageActions';
import MessageErrorActions, { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type IRoomViewProps } from '../definitions';
import { useRoomStore } from '../stores/RoomStoreContext';

type IRoomMessageActionsProps = Pick<
	IMessageActionsProps,
	'editInit' | 'replyInit' | 'quoteInit' | 'reactionInit' | 'onReactionPress' | 'jumpToMessage'
> & {
	tmid?: string;
	user: IRoomViewProps['user'];
	readOnly: boolean;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
};

export const RoomMessageActions = ({
	tmid,
	user,
	readOnly,
	messageActionsRef,
	messageErrorActionsRef,
	editInit,
	replyInit,
	quoteInit,
	reactionInit,
	onReactionPress,
	jumpToMessage
}: IRoomMessageActionsProps) => {
	'use memo';

	const room = useRoomStore(s => s.room);

	if (!('id' in room)) {
		return null;
	}
	return (
		<>
			<MessageActions
				ref={(ref: IMessageActions | null) => {
					messageActionsRef.current = ref;
				}}
				tmid={tmid}
				room={room}
				user={user}
				editInit={editInit}
				replyInit={replyInit}
				quoteInit={quoteInit}
				reactionInit={reactionInit}
				onReactionPress={onReactionPress}
				jumpToMessage={jumpToMessage}
				isReadOnly={readOnly}
			/>
			<MessageErrorActions
				ref={(ref: IMessageErrorActions | null) => {
					messageErrorActionsRef.current = ref;
				}}
				tmid={tmid}
			/>
		</>
	);
};
