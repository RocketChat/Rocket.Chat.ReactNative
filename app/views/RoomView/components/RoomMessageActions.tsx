import MessageActions, { type IMessageActions } from '../../../containers/MessageActions';
import MessageErrorActions, { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type IRoomMessageActionsProps } from '../definitions';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { useReadOnly } from '../hooks/useReadOnly';
import { useRoomStore } from '../stores/RoomStoreContext';

export const RoomMessageActions = ({
	tmid,
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
	const user = useAppSelector(getUserSelector);
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
