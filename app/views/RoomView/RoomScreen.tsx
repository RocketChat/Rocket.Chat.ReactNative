import { useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useStore } from 'zustand';

import { type IMessageActions } from '../../containers/MessageActions';
import { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import RoomClass from '../../lib/methods/subscriptions/room';
import { sendRoomMessage } from './services/sendRoomMessage';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useSetting } from '../../lib/hooks/useSetting';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import Banner from './components/Banner';
import JoinCode from './components/JoinCode';
import UploadProgress from './components/UploadProgress';
import List from './List';
import { type RoomType } from '../../definitions';
import { useActionSheet } from '../../containers/ActionSheet';
import { type IMessageComposerRef } from '../../containers/MessageComposer';
import { createMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { RoomProviders } from './components/RoomProviders';
import { RoomMessageProvider } from './components/RoomMessageProvider';
import { A11yGateProvider } from '../../containers/message/stores/A11yGate';
import { type IJoinCode, type IListContainerRef, type IRoomScreenProps, type IRoomViewState, type TListRef } from './definitions';
import { RoomFooter } from './components/RoomFooter/RoomFooter';
import { RoomMessageActions } from './components/RoomMessageActions';
import { isRoomFederated } from '../../lib/methods/isRoomFederated';
import { RoomLoadFailed } from './components/RoomLoadFailed';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { RoomScreenContext } from './stores/RoomScreenContext';
import { useMessageActions } from './hooks/useMessageActions';
import { useRoomInit } from './hooks/useRoomInit';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useRoomAudioLifecycle } from './hooks/useRoomAudioLifecycle';
import { useRoomRemoved } from './hooks/useRoomRemoved';
import { useRoomNavigation } from './hooks/useRoomNavigation';
import { useOmnichannelPermissions } from './hooks/useOmnichannelPermissions';
import { useInAppFeedback } from './hooks/useInAppFeedback';
import { useCloseBanner } from './hooks/useCloseBanner';
import { useLiveRef } from '../../lib/hooks/useLiveRef';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

// FIXME: handle servers with version < 3.0.0
// Return stable refs (model field / redux prop / shared empty) — a fresh [] here re-subscribes
// the message-list WatermelonDB query on every RoomView render (fetchMessages dep).
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

const RoomScreen = ({ route, rid, t, tmid, roomStore }: IRoomScreenProps) => {
	const { colors } = useTheme();

	const user = useAppSelector(getUserSelector);
	const isAuthenticated = useAppSelector(state => state.login.isAuthenticated);
	const baseUrl = useAppSelector(state => state.server.server);
	const serverVersion = useAppSelector(state => state.server.version);
	const Message_GroupingPeriod = useSetting('Message_GroupingPeriod') as number;
	const Message_Read_Receipt_Enabled = useSetting('Message_Read_Receipt_Enabled') as boolean;
	const Hide_System_Messages = useSetting('Hide_System_Messages') as string[];
	const { width } = useWindowDimensions();
	const isMasterDetail = useMasterDetail();
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const [messageActionStore] = useState(() => {
		const quoteMessageId = route.params?.messageId;
		return createMessageActionStore(quoteMessageId ? { kind: 'quote', messageIds: [quoteMessageId] } : null);
	});

	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

	const messageComposerRef = useRef<IMessageComposerRef | null>(null);
	const joinCodeRef = useRef<IJoinCode | null>(null);
	const listContainerRef = useRef<IListContainerRef | null>(null);
	const flatListRef: TListRef = useRef(null);
	const messageActionsRef = useRef<IMessageActions | null>(null);
	const messageErrorActionsRef = useRef<IMessageErrorActions | null>(null);

	const userRef = useLiveRef(user);

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const canAutoTranslate = useStore(roomStore, s => s.canAutoTranslate);

	const roomUserIdRef = useLiveRef(roomUserId);

	const hideSystemMessages = getHideSystemMessages(room, Hide_System_Messages);

	const { onThreadMessagesLoaded, onThreadPress, jumpToMessageByUrl } = useRoomNavigation({
		rid,
		tmid,
		t,
		isMasterDetail,
		listContainerRef,
		roomUserIdRef
	});

	const {
		resetAction,
		handleCloseEmoji,
		errorActionsShow,
		onEditInit,
		onEditCancel,
		onEditRequest,
		onQuoteInit,
		onRemoveQuoteMessage,
		onReactionPress,
		onReactionInit,
		onMessageLongPress,
		onReplyInit,
		setQuotesAndText,
		getText
	} = useMessageActions({
		messageActionStore,
		showActionSheet,
		hideActionSheet,
		rid,
		tmid,
		onThreadPress,
		messageComposerRef,
		messageActionsRef,
		messageErrorActionsRef
	});

	const roomScreen = useRoomInit({
		rid,
		tmid,
		isAuthenticated,
		roomStore,
		onThreadMessagesLoaded,
		messageActionStore,
		onQuoteInit
	});
	useRoomSubscription(sub);
	useRoomAudioLifecycle(rid, tmid);
	useRoomRemoved(rid, isMasterDetail);
	const handleSendMessage = (message?: string, tshow?: boolean) =>
		sendRoomMessage({
			rid,
			message,
			tmid,
			user: userRef.current,
			tshow,
			onMessageSent: roomScreen.clearLastSeen,
			resetAction
		});

	const onJoin = () => {
		roomStore.getState().join();
	};

	useInAppFeedback();

	const closeBanner = useCloseBanner(room);

	useOmnichannelPermissions({ rid, t, roomStore });

	if (roomScreen.failed) {
		return <RoomLoadFailed onRetry={roomScreen.retry} />;
	}

	let bannerClosed;
	let announcement;
	if ('id' in room) {
		({ bannerClosed, announcement } = room);
	}

	const federated = 'id' in room && isRoomFederated(room);

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
					onSendMessage={handleSendMessage}
					setQuotesAndText={setQuotesAndText}
					getText={getText}>
					<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-view'>
						{!tmid ? (
							<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />
						) : null}
						<A11yGateProvider>
							<RoomMessageProvider
								roomActions={{ onThreadPress, onReactionPress, sendMessage: handleSendMessage }}
								jumpToMessage={jumpToMessageByUrl}
								closeEmojiAndAction={handleCloseEmoji}
								reactionInit={onReactionInit}
								errorActionsShow={errorActionsShow}
								archived={'id' in room && room.archived}
								isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
								rid={room.rid}
								broadcast={'id' in room && room.broadcast}
								isThreadRoom={!!tmid}
								tmid={tmid}
								Message_GroupingPeriod={Message_GroupingPeriod}
								autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
								autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}>
								<List
									ref={listContainerRef}
									flatListRef={flatListRef}
									rid={room.rid}
									t={room.t as RoomType}
									tmid={tmid}
									onLongPress={onMessageLongPress}
									hideSystemMessages={hideSystemMessages}
									showMessageInMainThread={user.showMessageInMainThread ?? false}
									serverVersion={serverVersion}
								/>
							</RoomMessageProvider>
						</A11yGateProvider>
						<RoomFooter messageComposerRef={messageComposerRef} joinCodeRef={joinCodeRef} />
						<RoomMessageActions
							tmid={tmid}
							user={user}
							messageActionsRef={messageActionsRef}
							messageErrorActionsRef={messageErrorActionsRef}
							editInit={onEditInit}
							replyInit={onReplyInit}
							quoteInit={onQuoteInit}
							reactionInit={onReactionInit}
							onReactionPress={onReactionPress}
							jumpToMessage={jumpToMessageByUrl}
						/>
						<UploadProgress rid={room.rid} user={user} baseUrl={baseUrl} width={width} />
						<JoinCode ref={joinCodeRef} onJoin={onJoin} rid={room.rid} t={room.t} />
					</SafeAreaView>
				</RoomProviders>
			</RoomScreenContext.Provider>
		</RoomStoreContext.Provider>
	);
};

export default RoomScreen;
