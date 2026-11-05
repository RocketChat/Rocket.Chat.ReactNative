import { useMemo } from 'react';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useSetting } from '~/lib/hooks/useSetting';
import { isRoomFederated } from '~/lib/methods/isRoomFederated';
import { getHiddenSystemMessages } from '~/lib/methods/helpers/getHiddenSystemMessages';
import { getUserSelector } from '~/selectors/login';
import { type RoomType } from '~/definitions';
import { A11yGateProvider } from '~/containers/message/stores/A11yGate';
import { type IRoomMessageListProps } from '../definitions';
import { fromSubscription, useRoomStore } from '../stores/RoomStoreContext';
import List from '../List';
import { RoomMessageProvider } from './RoomMessageProvider';

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
	const rid = useRoomStore(s => s.room.rid);
	const t = useRoomStore(s => s.room.t) as RoomType;
	const federated = useRoomStore(fromSubscription(room => isRoomFederated(room), false));
	const archived = useRoomStore(fromSubscription(room => !!room.archived, false));
	const broadcast = useRoomStore(fromSubscription(room => !!room.broadcast, false));
	const roomAutoTranslate = useRoomStore(fromSubscription(room => !!room.autoTranslate, false));
	const autoTranslateLanguage = useRoomStore(fromSubscription(room => room.autoTranslateLanguage || undefined, undefined));
	const canAutoTranslate = useRoomStore(s => s.canAutoTranslate);
	const showMessageInMainThread = useAppSelector(state => getUserSelector(state).showMessageInMainThread ?? false);
	const serverVersion = useAppSelector(state => state.server.version);
	const Message_GroupingPeriod = useSetting('Message_GroupingPeriod') as number;
	const Message_Read_Receipt_Enabled = useSetting('Message_Read_Receipt_Enabled') as boolean;
	const Hide_System_Messages = useSetting('Hide_System_Messages');
	const roomSysMes = useRoomStore(s => s.room.sysMes);
	const hideSystemMessages = useMemo(
		() => getHiddenSystemMessages(roomSysMes, Hide_System_Messages),
		[roomSysMes, Hide_System_Messages]
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
				rid={rid}
				broadcast={broadcast}
				isThreadRoom={!!tmid}
				tmid={tmid}
				Message_GroupingPeriod={Message_GroupingPeriod}
				autoTranslateRoom={canAutoTranslate && roomAutoTranslate}
				autoTranslateLanguage={autoTranslateLanguage}>
				<List
					ref={listContainerRef}
					flatListRef={flatListRef}
					rid={rid}
					t={t}
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
