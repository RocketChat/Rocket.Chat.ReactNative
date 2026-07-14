import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import database from '../../lib/database';
import { type IMessageActions } from '../../containers/MessageActions';
import { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import I18n from '../../i18n';
import { withTheme } from '../../theme';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../lib/hooks/withDimensions';
import { withMasterDetail } from '../../lib/hooks/useMasterDetail';
import Banner from './Banner';
import JoinCode, { type IJoinCode } from './JoinCode';
import UploadProgress from './UploadProgress';
import List from './List';
import { type IApplicationState, type TAnyMessageModel, type RoomType } from '../../definitions';
import { themes } from '../../lib/constants/colors';
import { getUidDirectMessage, getRoomTitle } from '../../lib/methods/helpers';
import { withActionSheet } from '../../containers/ActionSheet';
import { type IMessageComposerRef } from '../../containers/MessageComposer';
import { createMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { RoomProviders } from './RoomProviders';
import { MessageRoomProvider } from '../../containers/message/stores/MessageRoomStore';
import { A11yGateProvider } from '../../containers/message/stores/A11yGate';
import { type IListContainerRef, type TListRef } from './List/definitions';
import { type IRoomViewProps, type IRoomViewState } from './definitions';
import { EncryptedRoom, MessageRow, MissingRoomE2EEKey, RoomFooter, RoomMessageActions } from './components';
import { isRoomFederated } from '../../lib/methods/isRoomFederated';
import { InvitedRoom } from './components/InvitedRoom';
import { getInvitationData } from '../../lib/methods/getInvitationData';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { getOrCreateRoomStore, releaseRoomStore } from './stores/RoomStore';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { useHeader } from './hooks/useHeader';
import { useMessageActions } from './hooks/useMessageActions';
import { useE2EEStatus } from './hooks/useE2EEStatus';
import { useRoomInit } from './hooks/useRoomInit';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useRoomAudioLifecycle } from './hooks/useRoomAudioLifecycle';
import { useRoomRemoved } from './hooks/useRoomRemoved';
import { useRoomActions } from './hooks/useRoomActions';
import { useJoinRoomPublisher } from './hooks/useJoinRoomPublisher';
import { useRoomNavigation } from './hooks/useRoomNavigation';
import { useOmnichannelPermissions } from './hooks/useOmnichannelPermissions';
import { useInAppFeedback } from './hooks/useInAppFeedback';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

const RoomView = (props: IRoomViewProps) => {
	'use memo';

	const {
		route,
		navigation,
		theme,
		user,
		isAuthenticated,
		baseUrl,
		serverVersion,
		isMasterDetail,
		width,
		Message_GroupingPeriod,
		Message_Read_Receipt_Enabled,
		Hide_System_Messages,
		livechatAllowManualOnHold,
		showActionSheet,
		hideActionSheet
	} = props;

	const rid = route.params?.rid;
	const t = route.params?.t;
	/**
	 * On threads, we don't have a subscription.
	 * `room` is going to have only a few properties sent during navigation.
	 * Use `tmid` as thread id.
	 */
	const tmid = route.params?.tmid;

	const [messageActionStore] = useState(() => {
		const quoteMessageId = route.params?.messageId;
		return createMessageActionStore(quoteMessageId ? { kind: 'quote', messageIds: [quoteMessageId] } : null);
	});

	const [initialRoom] = useState<IRoomViewState['room']>(() => ({
		rid: rid as string,
		t: t as string,
		name: route.params?.name,
		fname: route.params?.fname,
		prid: route.params?.prid,
		visitor: route.params?.visitor
	}));
	const [initialRoomUserId] = useState(() => route.params?.roomUserId ?? getUidDirectMessage(initialRoom));
	// we don't need to subscribe to threads
	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

	const messageComposerRef = useRef<IMessageComposerRef | null>(null);
	const joinCodeRef = useRef<IJoinCode | null>(null);
	// ListContainer component
	const listRef = useRef<IListContainerRef | null>(null);
	// FlatList inside ListContainer
	const flatListRef: TListRef = useRef(null);
	const messageActionsRef = useRef<IMessageActions | null>(null);
	const messageErrorActionsRef = useRef<IMessageErrorActions | null>(null);

	// Live-mirror refs let frozen provider handlers stay referentially stable while reading fresh values.
	const roomRef = useRef(initialRoom);
	const roomUserIdRef = useRef(initialRoomUserId);
	const cancelJumpToMessageRef = useRef<() => void>(() => {});
	const userRef = useRef(user);

	const [roomStore] = useState(() => getOrCreateRoomStore({ rid, t, initialRoom, roomUserId: initialRoomUserId }));
	// rid is stable for this RoomView instance (it's what roomStore was acquired for); release once on unmount.
	useEffect(() => () => releaseRoomStore(rid ?? ''), [rid]);

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const joined = useStore(roomStore, s => s.joined);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const canAutoTranslate = useStore(roomStore, s => s.canAutoTranslate);

	const isOmnichannel = room.t === 'l';

	const hideSystemMessages = (() => {
		const { sysMes } = room;
		// FIXME: handle servers with version < 3.0.0
		// Return stable refs (model field / redux prop / shared empty) — a fresh [] here re-subscribes
		// the message-list WatermelonDB query on every RoomView render (fetchMessages dep).
		if (Array.isArray(sysMes)) {
			return sysMes;
		}
		if (Array.isArray(Hide_System_Messages)) {
			return Hide_System_Messages;
		}
		return EMPTY_HIDE_SYSTEM_MESSAGES;
	})();

	const { cancelJumpToMessage, onThreadMessagesLoaded, onThreadPress, jumpToMessageByUrl } = useRoomNavigation({
		rid,
		tmid,
		t,
		navigation,
		isMasterDetail,
		listRef,
		roomUserIdRef,
		cancelJumpToMessageRef
	});

	useEffect(() => {
		roomRef.current = room;
		roomUserIdRef.current = roomUserId;
		userRef.current = user;
		cancelJumpToMessageRef.current = cancelJumpToMessage;
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
		navigation,
		rid,
		tmid,
		roomUserId,
		onThreadPress,
		messageComposerRef,
		messageActionsRef,
		messageErrorActionsRef
	});

	useRoomInit({ rid, tmid, isAuthenticated, roomStore, roomUpdate, onThreadMessagesLoaded, messageActionStore, onQuoteInit });
	useRoomSubscription(sub);
	useRoomAudioLifecycle(rid, tmid, navigation);
	useRoomRemoved(rid, isMasterDetail, roomRef);
	useJoinRoomPublisher({ roomStore, room, isOmnichannel, serverVersion, t, joinCodeRef });
	const { onJoin, handleSendMessage } = useRoomActions({
		rid,
		tmid,
		roomStore,
		userRef,
		resetAction
	});

	useInAppFeedback();

	const closeBanner = async () => {
		if ('id' in room) {
			try {
				const db = database.active;
				await db.write(async () => {
					await room.update(r => {
						r.bannerClosed = true;
					});
				});
			} catch {
				// do nothing
			}
		}
	};

	useOmnichannelPermissions({
		rid,
		t,
		room,
		roomUpdate,
		joined,
		livechatAllowManualOnHold,
		roomStore
	});

	const { showMissingE2EEKey, showE2EEDisabledRoom } = useE2EEStatus(rid);

	useHeader();

	const renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => (
		<MessageRow
			item={item}
			previousItem={previousItem}
			highlightedMessage={highlightedMessage}
			onLongPress={onMessageLongPress}
		/>
	);

	if ('id' in room && isInviteSubscription(room)) {
		const { title, description, inviter, accept, reject } = getInvitationData(room);

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view-invited'>
				<InvitedRoom title={title} description={description} inviter={inviter} onAccept={accept} onReject={reject} />
			</SafeAreaView>
		);
	}

	if ('encrypted' in room) {
		// Missing room encryption key
		if (showMissingE2EEKey) {
			return <MissingRoomE2EEKey />;
		}

		// Encrypted room, but user session is not encrypted
		if (showE2EEDisabledRoom) {
			return <EncryptedRoom navigation={navigation} roomName={getRoomTitle(room)} />;
		}
	}

	let bannerClosed;
	let announcement;
	if ('id' in room) {
		({ bannerClosed, announcement } = room);
	}

	const federated = 'id' in room && isRoomFederated(room);

	return (
		<RoomStoreContext.Provider value={roomStore}>
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
				<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view'>
					{!tmid ? (
						<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />
					) : null}
					<A11yGateProvider>
						<MessageRoomProvider
							jumpToMessage={jumpToMessageByUrl}
							closeEmojiAndAction={handleCloseEmoji}
							reactionInit={onReactionInit}
							errorActionsShow={errorActionsShow}
							archived={'id' in room && room.archived}
							isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
							rid={room.rid}
							user={user as any}
							baseUrl={baseUrl}
							broadcast={'id' in room && room.broadcast}
							isThreadRoom={!!tmid}
							tmid={tmid}
							Message_GroupingPeriod={Message_GroupingPeriod}
							autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
							autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}>
							<List
								ref={listRef}
								listRef={flatListRef}
								rid={room.rid}
								t={room.t as RoomType}
								tmid={tmid}
								renderRow={renderItem}
								hideSystemMessages={hideSystemMessages}
								showMessageInMainThread={user.showMessageInMainThread ?? false}
								serverVersion={serverVersion}
							/>
						</MessageRoomProvider>
					</A11yGateProvider>
					<RoomFooter messageComposerRef={messageComposerRef} />
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
					<JoinCode ref={joinCodeRef} onJoin={onJoin} rid={room.rid} t={room.t} theme={theme} />
				</SafeAreaView>
			</RoomProviders>
		</RoomStoreContext.Provider>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled as boolean,
	Hide_System_Messages: state.settings.Hide_System_Messages as string[],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean
});

export default connect(mapStateToProps)(
	withDimensions(withTheme(withSafeAreaInsets(withActionSheet(withMasterDetail(RoomView)))))
);
