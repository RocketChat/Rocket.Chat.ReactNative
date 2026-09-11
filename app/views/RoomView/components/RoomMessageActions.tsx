import MessageActions from '../../../containers/MessageActions';
import MessageErrorActions from '../../../containers/MessageErrorActions';
import { type IRoomMessageActionsProps } from '../definitions';
import { type TSubscriptionModel } from '../../../definitions';
import { isSubscriptionModel } from '../../../definitions/TRoom';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../selectors/login';
import { useReadOnly } from '../hooks/useReadOnly';
import { useRoomStore, useRoomStoreApi } from '../stores/RoomStoreContext';

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
	const roomStore = useRoomStoreApi();
	const isSubscribed = useRoomStore(s => isSubscriptionModel(s.room));
	const user = useAppSelector(getUserSelector);
	const readOnly = useReadOnly();

	if (!isSubscribed) {
		return null;
	}

	const room = roomStore.getState().room as TSubscriptionModel;

	return (
		<>
			<MessageActions
				ref={messageActionsRef}
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
			<MessageErrorActions ref={messageErrorActionsRef} tmid={tmid} />
		</>
	);
};
