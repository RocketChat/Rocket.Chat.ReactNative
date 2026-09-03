import { useRef } from 'react';
import { useStore } from 'zustand';

import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import JoinCode from './components/JoinCode';
import { type IJoinCode, type IRoomScreenProps } from './definitions';
import { RoomProviders } from './components/RoomProviders';
import { RoomAnnouncementBanner } from './components/RoomAnnouncementBanner';
import { RoomFooter } from './components/RoomFooter/RoomFooter';
import { RoomLoadFailed } from './components/RoomLoadFailed';
import { RoomMessageActions } from './components/RoomMessageActions';
import { RoomMessageList } from './components/RoomMessageList';
import { RoomUploadProgress } from './components/RoomUploadProgress';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { RoomScreenContext } from './stores/RoomScreenContext';
import { useRoomMessaging } from './hooks/useRoomMessaging';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useRoomAudioLifecycle } from './hooks/useRoomAudioLifecycle';
import { useRoomRemoved } from './hooks/useRoomRemoved';
import { useOmnichannelPermissions } from './hooks/useOmnichannelPermissions';
import { useInAppFeedback } from './hooks/useInAppFeedback';

const RoomScreen = ({ route, rid, t, tmid, roomStore, ready }: IRoomScreenProps) => {
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const roomUserId = useStore(roomStore, s => s.roomUserId);

	const {
		messageActionStore,
		roomScreen,
		messageComposerRef,
		listContainerRef,
		flatListRef,
		messageActionsRef,
		messageErrorActionsRef,
		onThreadPress,
		sendMessage,
		jumpToMessage,
		closeEmojiAndAction,
		errorActionsShow,
		onMessageLongPress,
		onEditInit,
		onEditCancel,
		onEditRequest,
		onQuoteInit,
		onRemoveQuoteMessage,
		onReactionInit,
		onReactionPress,
		onReplyInit,
		setQuotesAndText,
		getText
	} = useRoomMessaging({
		rid,
		t,
		tmid,
		roomStore,
		ready,
		roomUserId,
		quoteMessageId: route.params?.messageId
	});
	useRoomSubscription(rid, tmid);
	useRoomAudioLifecycle(rid, tmid);
	useRoomRemoved(rid, isMasterDetail, roomStore);
	useInAppFeedback();
	useOmnichannelPermissions({ rid, t, roomStore });

	const joinCodeRef = useRef<IJoinCode | null>(null);
	const onJoin = () => {
		roomStore.getState().join();
	};

	if (roomScreen.failed) {
		return <RoomLoadFailed onRetry={roomScreen.retry} />;
	}

	return (
		<RoomStoreContext.Provider value={roomStore}>
			<RoomScreenContext.Provider value={roomScreen}>
				<RoomProviders
					store={messageActionStore}
					rid={room.rid}
					t={room.t}
					room={room}
					roomUpdate={roomUpdate}
					tmid={tmid}
					sharing={false}
					onRemoveQuoteMessage={onRemoveQuoteMessage}
					editCancel={onEditCancel}
					editRequest={onEditRequest}
					onSendMessage={sendMessage}
					setQuotesAndText={setQuotesAndText}
					getText={getText}>
					<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-view'>
						{!tmid ? <RoomAnnouncementBanner /> : null}
						<RoomMessageList
							tmid={tmid}
							listContainerRef={listContainerRef}
							flatListRef={flatListRef}
							onLongPress={onMessageLongPress}
							onThreadPress={onThreadPress}
							onReactionPress={onReactionPress}
							sendMessage={sendMessage}
							jumpToMessage={jumpToMessage}
							closeEmojiAndAction={closeEmojiAndAction}
							reactionInit={onReactionInit}
							errorActionsShow={errorActionsShow}
						/>
						<RoomFooter messageComposerRef={messageComposerRef} joinCodeRef={joinCodeRef} />
						<RoomMessageActions
							tmid={tmid}
							messageActionsRef={messageActionsRef}
							messageErrorActionsRef={messageErrorActionsRef}
							editInit={onEditInit}
							replyInit={onReplyInit}
							quoteInit={onQuoteInit}
							reactionInit={onReactionInit}
							onReactionPress={onReactionPress}
							jumpToMessage={jumpToMessage}
						/>
						<RoomUploadProgress />
						<JoinCode ref={joinCodeRef} onJoin={onJoin} rid={room.rid} t={room.t} />
					</SafeAreaView>
				</RoomProviders>
			</RoomScreenContext.Provider>
		</RoomStoreContext.Provider>
	);
};

export default RoomScreen;
