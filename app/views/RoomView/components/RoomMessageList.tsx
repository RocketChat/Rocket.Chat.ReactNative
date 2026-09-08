import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useSetting } from '../../../lib/hooks/useSetting';
import { isRoomFederated } from '../../../lib/methods/isRoomFederated';
import { getUserSelector } from '../../../selectors/login';
import { type RoomType } from '../../../definitions';
import { A11yGateProvider } from '../../../containers/message/stores/A11yGate';
import { type IRoomMessageListProps } from '../definitions';
import { type TRoomOrPreview } from '../../../definitions/TRoom';
import { getRoom, type RoomSnapshot } from '../../../lib/roomObservation';
import { useRoomStore, useRoom } from '../stores/RoomStoreContext';
import List from '../List';
import { RoomMessageProvider } from './RoomMessageProvider';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

// FIXME: handle servers with version < 3.0.0
const getHideSystemMessages = (room: TRoomOrPreview, Hide_System_Messages?: string[]): string[] => {
	const { sysMes } = room;
	if (Array.isArray(sysMes)) {
		return sysMes;
	}
	if (Array.isArray(Hide_System_Messages)) {
		return Hide_System_Messages;
	}
	return EMPTY_HIDE_SYSTEM_MESSAGES;
};

const getListRoomValues = (snapshot: RoomSnapshot, Hide_System_Messages?: string[]) => {
	const room = getRoom(snapshot);
	const subscribed = 'id' in room ? room : undefined;
	return {
		archived: subscribed?.archived,
		broadcast: subscribed?.broadcast,
		federated: !!subscribed && isRoomFederated(subscribed),
		autoTranslate: subscribed?.autoTranslate,
		autoTranslateLanguage: subscribed?.autoTranslateLanguage,
		hideSystemMessages: getHideSystemMessages(room, Hide_System_Messages)
	};
};

export const RoomMessageList = ({
	tmid,
	listContainerRef,
	flatListRef,
	onLongPress,
	onThreadPress,
	onReactionPress,
	sendMessage,
	jumpToMessage,
	closeEmojiAndAction,
	reactionInit,
	errorActionsShow
}: IRoomMessageListProps) => {
	const { room, snapshot } = useRoom();
	const canAutoTranslate = useRoomStore(s => s.canAutoTranslate);
	const showMessageInMainThread = useAppSelector(state => getUserSelector(state).showMessageInMainThread ?? false);
	const serverVersion = useAppSelector(state => state.server.version);
	const Message_GroupingPeriod = useSetting('Message_GroupingPeriod') as number;
	const Message_Read_Receipt_Enabled = useSetting('Message_Read_Receipt_Enabled') as boolean;
	const Hide_System_Messages = useSetting('Hide_System_Messages') as string[];

	const { archived, broadcast, federated, autoTranslate, autoTranslateLanguage, hideSystemMessages } = getListRoomValues(
		snapshot,
		Hide_System_Messages
	);

	return (
		<A11yGateProvider>
			<RoomMessageProvider
				onThreadPress={onThreadPress}
				onReactionPress={onReactionPress}
				sendMessage={sendMessage}
				jumpToMessage={jumpToMessage}
				closeEmojiAndAction={closeEmojiAndAction}
				reactionInit={reactionInit}
				errorActionsShow={errorActionsShow}
				archived={archived}
				isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
				rid={room.rid}
				broadcast={broadcast}
				isThreadRoom={!!tmid}
				tmid={tmid}
				Message_GroupingPeriod={Message_GroupingPeriod}
				autoTranslateRoom={canAutoTranslate && autoTranslate}
				autoTranslateLanguage={autoTranslateLanguage}>
				<List
					ref={listContainerRef}
					flatListRef={flatListRef}
					rid={room.rid}
					t={room.t as RoomType}
					tmid={tmid}
					onLongPress={onLongPress}
					hideSystemMessages={hideSystemMessages}
					showMessageInMainThread={showMessageInMainThread}
					serverVersion={serverVersion}
				/>
			</RoomMessageProvider>
		</A11yGateProvider>
	);
};
