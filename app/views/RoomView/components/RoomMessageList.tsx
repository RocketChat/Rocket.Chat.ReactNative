import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useSetting } from '../../../lib/hooks/useSetting';
import { isRoomFederated } from '../../../lib/methods/isRoomFederated';
import { getUserSelector } from '../../../selectors/login';
import { type RoomType } from '../../../definitions';
import { A11yGateProvider } from '../../../containers/message/stores/A11yGate';
import { type IRoomMessageListProps, type IRoomViewState } from '../definitions';
import { useRoomStore } from '../stores/RoomStoreContext';
import List from '../List';
import { RoomMessageProvider } from './RoomMessageProvider';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

// FIXME: handle servers with version < 3.0.0
// Return stable refs (model field / redux prop / shared empty) — a fresh [] here re-subscribes
// the message-list WatermelonDB query on every render (fetchMessages dep).
const getHideSystemMessages = (room: IRoomViewState['room'], Hide_System_Messages?: string[]): string[] => {
	const { sysMes } = room;
	if (Array.isArray(sysMes)) {
		return sysMes;
	}
	if (Array.isArray(Hide_System_Messages)) {
		return Hide_System_Messages;
	}
	return EMPTY_HIDE_SYSTEM_MESSAGES;
};

export const RoomMessageList = ({
	tmid,
	listContainerRef,
	flatListRef,
	onLongPress,
	roomActions,
	jumpToMessage,
	closeEmojiAndAction,
	reactionInit,
	errorActionsShow
}: IRoomMessageListProps) => {
	const room = useRoomStore(s => s.room);
	const canAutoTranslate = useRoomStore(s => s.canAutoTranslate);
	const showMessageInMainThread = useAppSelector(state => getUserSelector(state).showMessageInMainThread ?? false);
	const serverVersion = useAppSelector(state => state.server.version);
	const Message_GroupingPeriod = useSetting('Message_GroupingPeriod') as number;
	const Message_Read_Receipt_Enabled = useSetting('Message_Read_Receipt_Enabled') as boolean;
	const Hide_System_Messages = useSetting('Hide_System_Messages') as string[];

	const subscribed = 'id' in room ? room : undefined;
	const federated = !!subscribed && isRoomFederated(subscribed);

	return (
		<A11yGateProvider>
			<RoomMessageProvider
				roomActions={roomActions}
				jumpToMessage={jumpToMessage}
				closeEmojiAndAction={closeEmojiAndAction}
				reactionInit={reactionInit}
				errorActionsShow={errorActionsShow}
				archived={subscribed?.archived}
				isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
				rid={room.rid}
				broadcast={subscribed?.broadcast}
				isThreadRoom={!!tmid}
				tmid={tmid}
				Message_GroupingPeriod={Message_GroupingPeriod}
				autoTranslateRoom={canAutoTranslate && subscribed?.autoTranslate}
				autoTranslateLanguage={subscribed?.autoTranslateLanguage}>
				<List
					ref={listContainerRef}
					flatListRef={flatListRef}
					rid={room.rid}
					t={room.t as RoomType}
					tmid={tmid}
					onLongPress={onLongPress}
					hideSystemMessages={getHideSystemMessages(room, Hide_System_Messages)}
					showMessageInMainThread={showMessageInMainThread}
					serverVersion={serverVersion}
				/>
			</RoomMessageProvider>
		</A11yGateProvider>
	);
};
