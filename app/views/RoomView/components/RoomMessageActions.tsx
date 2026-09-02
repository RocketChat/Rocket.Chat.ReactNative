import { type RefObject } from 'react';

import MessageActions, { type IMessageActions, type IMessageActionsProps } from '../../../containers/MessageActions';
import MessageErrorActions, { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type ILoggedUser } from '../../../definitions';
import { useReadOnly } from '../hooks/useReadOnly';
import { useRoomStore } from '../../../lib/store/RoomStoreContext';

type TRoomViewUser = Pick<ILoggedUser, 'id' | 'username' | 'token' | 'showMessageInMainThread'>;

type IRoomMessageActionsProps = Pick<
	IMessageActionsProps,
	'editInit' | 'replyInit' | 'quoteInit' | 'reactionInit' | 'onReactionPress' | 'jumpToMessage'
> & {
	tmid?: string;
	user: TRoomViewUser;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
};

export const RoomMessageActions = ({
	tmid,
	user,
	messageActionsRef,
	messageErrorActionsRef,
	editInit,
	replyInit,
	quoteInit,
	reactionInit,
	onReactionPress,
	jumpToMessage
}: IRoomMessageActionsProps) => {
	const room = useRoomStore(s => s.room);
	const readOnly = useReadOnly();

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
