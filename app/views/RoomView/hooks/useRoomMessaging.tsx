import { useRef, useState } from 'react';

import { type IMessageActions } from '../../../containers/MessageActions';
import { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type IMessageComposerRef } from '../../../containers/MessageComposer';
import { useActionSheet } from '../../../containers/ActionSheet';
import { createMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { getUserSelector } from '../../../selectors/login';
import {
	type IListContainerRef,
	type IUseRoomMessagingParams,
	type IUseRoomMessagingResult,
	type TListRef
} from '../definitions';
import { sendRoomMessage } from '../services/sendRoomMessage';
import { useMessageActions } from './useMessageActions';
import { useRoomInit } from './useRoomInit';
import { useRoomNavigation } from './useRoomNavigation';

// Everything a room screen does with messages: the message-action store, the imperative handles
// (composer, list, action sheets), navigation between messages, and the init run that anchors them.
// The result is grouped by the component that consumes each slice.
export function useRoomMessaging({
	rid,
	t,
	tmid,
	roomStore,
	roomUserId,
	quoteMessageId
}: IUseRoomMessagingParams): IUseRoomMessagingResult {
	const isAuthenticated = useAppSelector(state => state.login.isAuthenticated);
	const user = useAppSelector(getUserSelector);
	const isMasterDetail = useMasterDetail();
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const [messageActionStore] = useState(() =>
		createMessageActionStore(quoteMessageId ? { kind: 'quote', messageIds: [quoteMessageId] } : null)
	);

	const messageComposerRef = useRef<IMessageComposerRef | null>(null);
	const listContainerRef = useRef<IListContainerRef | null>(null);
	const flatListRef: TListRef = useRef(null);
	const messageActionsRef = useRef<IMessageActions | null>(null);
	const messageErrorActionsRef = useRef<IMessageErrorActions | null>(null);

	const userRef = useLiveRef(user);
	const roomUserIdRef = useLiveRef(roomUserId);

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

	const roomScreen = useRoomInit({ rid, tmid, isAuthenticated, roomStore, onThreadMessagesLoaded });

	const sendMessage = (message?: string, tshow?: boolean) =>
		sendRoomMessage({
			rid,
			message,
			tmid,
			user: userRef.current,
			tshow,
			onMessageSent: roomScreen.clearLastSeen,
			resetAction
		});

	return {
		messageActionStore,
		roomScreen,
		messageComposerRef,
		composer: {
			onRemoveQuoteMessage,
			editCancel: onEditCancel,
			editRequest: onEditRequest,
			onSendMessage: sendMessage,
			setQuotesAndText,
			getText
		},
		messageList: {
			listContainerRef,
			flatListRef,
			onLongPress: onMessageLongPress,
			roomActions: { onThreadPress, onReactionPress, sendMessage },
			jumpToMessage: jumpToMessageByUrl,
			closeEmojiAndAction: handleCloseEmoji,
			reactionInit: onReactionInit,
			errorActionsShow
		},
		messageActions: {
			messageActionsRef,
			messageErrorActionsRef,
			editInit: onEditInit,
			replyInit: onReplyInit,
			quoteInit: onQuoteInit,
			reactionInit: onReactionInit,
			onReactionPress,
			jumpToMessage: jumpToMessageByUrl
		}
	};
}
