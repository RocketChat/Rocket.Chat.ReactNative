import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { type Subscription } from 'rxjs';
import { useStore } from 'zustand';

import Touch from '../../containers/Touch';
import database from '../../lib/database';
import MessageActions, { type IMessageActions } from '../../containers/MessageActions';
import MessageErrorActions, { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import I18n from '../../i18n';
import { isBlocked } from '../../lib/methods/helpers/room';
import { isReadOnly } from '../../lib/methods/helpers/isReadOnly';
import { withTheme } from '../../theme';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../lib/hooks/withDimensions';
import { withMasterDetail } from '../../lib/hooks/useMasterDetail';
import { ContainerTypes } from '../../containers/UIKit/interfaces';
import Banner from './Banner';
import styles from './styles';
import JoinCode, { type IJoinCode } from './JoinCode';
import UploadProgress from './UploadProgress';
import List from './List';
import {
	type IApplicationState,
	type ISubscription,
	type SubscriptionType,
	type TAnyMessageModel,
	type RoomType
} from '../../definitions';
import { themes } from '../../lib/constants/colors';
import { triggerBlockAction } from '../../lib/methods/triggerActions';
import { getUidDirectMessage, getRoomTitle } from '../../lib/methods/helpers';
import { withActionSheet } from '../../containers/ActionSheet';
import { ComposerAttachments, type IMessageComposerRef, MessageComposerContainer } from '../../containers/MessageComposer';
import { createMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { RoomProviders } from './RoomProviders';
import { MessageRoomProvider } from '../../containers/message/stores/MessageRoomStore';
import { type IListContainerRef, type TListRef } from './List/definitions';
import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../lib/encryption/utils';
import { type IRoomViewProps, type IRoomViewState } from './definitions';
import { EncryptedRoom, MessageRow, MissingRoomE2EEKey } from './components';
import { type IRoomFederated, isRoomFederated, isRoomNativeFederated } from '../../lib/methods/isRoomFederated';
import { InvitedRoom } from './components/InvitedRoom';
import { getInvitationData } from '../../lib/methods/getInvitationData';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { getOrCreateRoomStore, releaseRoomStore } from './stores/RoomStore';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { useHeader } from './hooks/useHeader';
import { useMessageActions } from './hooks/useMessageActions';
import { useRoomLifecycle } from './hooks/useRoomLifecycle';
import { useRoomNavigation } from './hooks/useRoomNavigation';
import { useOmnichannelPermissions } from './hooks/useOmnichannelPermissions';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

export type TRoomViewReducerState = Pick<
	IRoomViewState,
	'readOnly' | 'unreadsCount' | 'isAutocompleteVisible' | 'showMissingE2EEKey' | 'showE2EEDisabledRoom'
>;

const initialReducerState: TRoomViewReducerState = {
	readOnly: false,
	unreadsCount: null,
	isAutocompleteVisible: false,
	showMissingE2EEKey: false,
	showE2EEDisabledRoom: false
};

const roomViewStateReducer = (state: TRoomViewReducerState, partial: Partial<TRoomViewReducerState>): TRoomViewReducerState => ({
	...state,
	...partial
});

const RoomView = (props: IRoomViewProps) => {
	const {
		route,
		navigation,
		dispatch,
		theme,
		user,
		isAuthenticated,
		baseUrl,
		serverVersion,
		isMasterDetail,
		width,
		insets,
		Message_GroupingPeriod,
		Message_Read_Receipt_Enabled,
		Hide_System_Messages,
		transferLivechatGuestPermission,
		viewCannedResponsesPermission,
		livechatAllowManualOnHold,
		encryptionEnabled,
		airGappedRestrictionRemainingDays,
		isFederationEnabled,
		isFederationModuleEnabled,
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

	const [initialRoom] = useState<IRoomViewState['room']>(
		() =>
			route.params?.room ?? {
				rid: rid as string,
				t: t as string,
				name: route.params?.name,
				fname: route.params?.fname,
				prid: route.params?.prid
			}
	);
	const [initialRoomUserId] = useState(() => route.params?.roomUserId ?? getUidDirectMessage(initialRoom));
	// we don't need to subscribe to threads
	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

	const [state, setState] = useReducer(roomViewStateReducer, initialReducerState);

	const messageComposerRef = useRef<IMessageComposerRef | null>(null);
	const joinCodeRef = useRef<IJoinCode | null>(null);
	// ListContainer component
	const listRef = useRef<IListContainerRef | null>(null);
	// FlatList inside ListContainer
	const flatListRef: TListRef = useRef(null);
	const queryUnreadsRef = useRef<Subscription | null>(null);
	const messageActionsRef = useRef<IMessageActions | null>(null);
	const messageErrorActionsRef = useRef<IMessageErrorActions | null>(null);
	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);

	// Live-mirror refs let frozen provider handlers stay referentially stable while reading fresh values.
	const roomRef = useRef(initialRoom);
	const roomUserIdRef = useRef(initialRoomUserId);
	const unreadsCountRef = useRef<number | null>(null);
	const cancelJumpToMessageRef = useRef<() => void>(() => {});
	const userRef = useRef(user);

	const [roomStore] = useState(() => getOrCreateRoomStore({ rid, t, initialRoom, roomUserId: initialRoomUserId }));
	// rid is stable for this RoomView instance (it's what roomStore was acquired for); release once on unmount.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => () => releaseRoomStore(rid ?? ''), []);

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const joined = useStore(roomStore, s => s.joined);
	const member = useStore(roomStore, s => s.member);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const loading = useStore(roomStore, s => s.loading);
	const canAutoTranslate = useStore(roomStore, s => s.canAutoTranslate);
	const canForwardGuest = useStore(roomStore, s => s.canForwardGuest);
	const canReturnQueue = useStore(roomStore, s => s.canReturnQueue);
	const canViewCannedResponse = useStore(roomStore, s => s.canViewCannedResponse);
	const canPlaceLivechatOnHold = useStore(roomStore, s => s.canPlaceLivechatOnHold);

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

	const {
		navToThread,
		cancelJumpToMessage,
		consumeJumpParam,
		onThreadMessagesLoaded,
		onDiscussionPress,
		onThreadPress,
		jumpToMessageByUrl,
		onEncryptedPress,
		navToRoomInfo,
		handleEnterCall,
		goRoomActionsView
	} = useRoomNavigation({
		rid,
		tmid,
		t,
		navigation,
		isMasterDetail,
		listRef,
		member,
		joined,
		canForwardGuest,
		canReturnQueue,
		canViewCannedResponse,
		canPlaceLivechatOnHold,
		roomRef,
		roomUserIdRef,
		cancelJumpToMessageRef,
		pendingJumpRef
	});

	useEffect(() => {
		roomRef.current = room;
		roomUserIdRef.current = roomUserId;
		userRef.current = user;
		unreadsCountRef.current = state.unreadsCount;
		cancelJumpToMessageRef.current = cancelJumpToMessage;
	});

	const {
		resetAction,
		handleCloseEmoji,
		handleShowActionSheet,
		errorActionsShow,
		onEditInit,
		onEditCancel,
		onEditRequest,
		onQuoteInit,
		onRemoveQuoteMessage,
		onReactionPress,
		onReactionInit,
		onReactionLongPress,
		onMessageLongPress,
		showAttachment,
		onReplyInit,
		replyBroadcast,
		setQuotesAndText,
		getText
	} = useMessageActions({
		messageActionStore,
		showActionSheet,
		hideActionSheet,
		navigation,
		dispatch,
		rid,
		tmid,
		roomUserId,
		onThreadPress,
		messageComposerRef,
		messageActionsRef,
		messageErrorActionsRef
	});

	const { joinRoom, resumeRoom, onJoin, handleSendMessage, toggleFollowThread, fetchThreadName } = useRoomLifecycle({
		rid,
		tmid,
		t,
		isAuthenticated,
		isMasterDetail,
		isOmnichannel,
		room,
		roomUpdate,
		serverVersion,
		roomStore,
		navigation,
		route,
		dispatch,
		messageActionStore,
		sub,
		queryUnreadsRef,
		pendingJumpRef,
		jumpToThreadIdRef,
		unreadsCountRef,
		roomRef,
		userRef,
		joinCodeRef,
		consumeJumpParam,
		navToThread,
		onQuoteInit,
		resetAction,
		onThreadMessagesLoaded,
		setState
	});

	const blockAction = useCallback(
		({
			actionId,
			appId,
			value,
			blockId,
			rid: blockRid,
			mid
		}: {
			actionId: string;
			appId: string;
			value: any;
			blockId: string;
			rid: string;
			mid: string;
		}) =>
			triggerBlockAction({
				blockId,
				actionId,
				value,
				mid,
				rid: blockRid,
				appId,
				container: {
					type: ContainerTypes.MESSAGE,
					id: mid
				}
			}),
		[]
	);

	const closeBanner = useCallback(async () => {
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
	}, [room]);

	const updateAutocompleteVisible = useCallback(
		(updatedAutocompleteVisible: boolean) => {
			if (updatedAutocompleteVisible && !state.isAutocompleteVisible) {
				// timeout to prevent conflict with default keyboard announcement.
				setTimeout(() => {
					AccessibilityInfo.announceForAccessibility(I18n.t('The_autocomplete_options_are_available_above_the_input_composer'));
				}, 800);
			}
			if (updatedAutocompleteVisible !== state.isAutocompleteVisible) {
				setState({ isAutocompleteVisible: updatedAutocompleteVisible });
			}
		},
		[state.isAutocompleteVisible]
	);

	useOmnichannelPermissions({
		rid,
		t,
		room,
		roomUpdate,
		joined,
		transferLivechatGuestPermission,
		viewCannedResponsesPermission,
		livechatAllowManualOnHold,
		roomStore
	});

	const setReadOnly = useCallback(async () => {
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		setState({ readOnly });
	}, [room, user]);

	const updateE2EEState = useCallback(() => {
		if (!('encrypted' in room)) {
			setState({ showMissingE2EEKey: false, showE2EEDisabledRoom: false });
			return;
		}
		const showMissingE2EEKey = isMissingRoomE2EEKey({
			encryptionEnabled,
			roomEncrypted: room.encrypted,
			E2EKey: room.E2EKey
		});
		const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({
			encryptionEnabled,
			roomEncrypted: room.encrypted
		});
		setState({ showMissingE2EEKey, showE2EEDisabledRoom });
	}, [room, encryptionEnabled]);

	useEffect(() => {
		setReadOnly();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate]);

	useEffect(() => {
		updateE2EEState();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [encryptionEnabled, roomUpdate.encrypted, roomUpdate.E2EKey]);

	useHeader({
		rid,
		tmid,
		roomType: t as SubscriptionType,
		roomName: route.params?.name,
		room,
		roomUpdate,
		unreadsCount: state.unreadsCount,
		roomUserId,
		joined,
		canForwardGuest,
		canReturnQueue,
		canPlaceLivechatOnHold,
		showMissingE2EEKey: state.showMissingE2EEKey,
		showE2EEDisabledRoom: state.showE2EEDisabledRoom,
		navigation,
		isMasterDetail,
		baseUrl,
		user,
		goRoomActionsView,
		toggleFollowThread,
		showActionSheet: handleShowActionSheet
	});

	const getFederatedFooterDescription = (federatedRoom: IRoomFederated) => {
		if (!isRoomNativeFederated(federatedRoom)) {
			return I18n.t('Federation_Matrix_room_description_invalid_version');
		}
		if (!isFederationEnabled) {
			return I18n.t('Federation_Matrix_room_description_disabled');
		}
		if (!isFederationModuleEnabled) {
			return I18n.t('Federation_Matrix_room_description_missing_module');
		}
		return undefined;
	};

	const renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => (
		<MessageRow
			item={item}
			previousItem={previousItem}
			highlightedMessage={highlightedMessage}
			onLongPress={onMessageLongPress}
		/>
	);

	const renderFooter = () => {
		const footerBottomInset = { paddingBottom: insets.bottom };

		if (!rid) {
			return null;
		}
		if ('onHold' in room && room.onHold) {
			return (
				<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Chat_is_on_hold')}</Text>
					<Touch
						onPress={resumeRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
						enabled={!loading}>
						<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-chat-on-hold-button'>
							{I18n.t('Resume')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (!joined) {
			return (
				<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-join' testID='room-view-join'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('You_are_in_preview_mode')}</Text>
					<Touch
						onPress={joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
						enabled={!loading}>
						<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-join-button'>
							{I18n.t(isOmnichannel ? 'Take_it' : 'Join')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (airGappedRestrictionRemainingDays !== undefined && airGappedRestrictionRemainingDays === 0) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_title')}
					</Text>
					<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_description')}
					</Text>
				</View>
			);
		}
		if (state.readOnly) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}

		if ('id' in room && isRoomFederated(room)) {
			const description = getFederatedFooterDescription(room);

			if (description) {
				return (
					<View style={[styles.readOnly, footerBottomInset]}>
						<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{description}</Text>
					</View>
				);
			}
		}

		return (
			<MessageComposerContainer ref={messageComposerRef}>
				<ComposerAttachments />
			</MessageComposerContainer>
		);
	};

	const renderActions = () => {
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
					editInit={onEditInit}
					replyInit={onReplyInit}
					quoteInit={onQuoteInit}
					reactionInit={onReactionInit}
					onReactionPress={onReactionPress}
					jumpToMessage={jumpToMessageByUrl}
					isReadOnly={state.readOnly}
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
		if (state.showMissingE2EEKey) {
			return <MissingRoomE2EEKey />;
		}

		// Encrypted room, but user session is not encrypted
		if (state.showE2EEDisabledRoom) {
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
				tmid={tmid}
				sharing={false}
				isAutocompleteVisible={state.isAutocompleteVisible}
				updateAutocompleteVisible={updateAutocompleteVisible}
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
					<MessageRoomProvider
						navToRoomInfo={navToRoomInfo}
						showAttachment={showAttachment}
						blockAction={blockAction}
						handleEnterCall={handleEnterCall}
						fetchThreadName={fetchThreadName}
						toggleFollowThread={toggleFollowThread}
						jumpToMessage={jumpToMessageByUrl}
						closeEmojiAndAction={handleCloseEmoji}
						onReactionPress={onReactionPress}
						onReactionLongPress={onReactionLongPress}
						reactionInit={onReactionInit}
						onDiscussionPress={onDiscussionPress}
						onThreadPress={onThreadPress}
						replyBroadcast={replyBroadcast}
						errorActionsShow={errorActionsShow}
						onAnswerButtonPress={handleSendMessage}
						onEncryptedPress={onEncryptedPress}
						archived={'id' in room && room.archived}
						isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
						rid={room.rid}
						user={user as any}
						baseUrl={baseUrl}
						broadcast={'id' in room && room.broadcast}
						isThreadRoom={!!tmid}
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
					{renderFooter()}
					{renderActions()}
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
	transferLivechatGuestPermission: state.permissions['transfer-livechat-guest'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	airGappedRestrictionRemainingDays: state.settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days,
	encryptionEnabled: state.encryption.enabled,
	isFederationEnabled: (state.settings.Federation_Matrix_enabled || state.settings.Federation_Service_Enabled) as boolean,
	isFederationModuleEnabled: state.enterpriseModules.includes('federation') as boolean
});

export default connect(mapStateToProps)(
	withDimensions(withTheme(withSafeAreaInsets(withActionSheet(withMasterDetail(RoomView)))))
);
