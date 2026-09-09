import { useRef, useState } from 'react';

import { type IMessageActions } from '../../../containers/MessageActions';
import { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type IMessageComposerRef } from '../../../containers/MessageComposer';
import { useActionSheet } from '../../../containers/ActionSheet';
import { createMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage as sendMessageRequest } from '../../../lib/methods/sendMessage';
import { getUserSelector } from '../../../selectors/login';
import { type IListContainerRef, type IUseRoomMessagingParams, type TListRef } from '../definitions';
import { useMessageActions } from './useMessageActions';
import { useRoomInit } from './useRoomInit';
import { useRoomNavigation } from './useRoomNavigation';

export function useRoomMessaging({ rid, t, tmid, roomStore, ready, roomUserId, quoteMessageId }: IUseRoomMessagingParams) {
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
		onReplyInit
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

	const roomScreen = useRoomInit({ rid, tmid, isAuthenticated, roomStore, onThreadMessagesLoaded, ready });

	const sendMessage = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessageRequest(rid as string, message, tmid, userRef.current, tshow)
			.then(() => {
				roomScreen.clearLastSeen();
				Review.pushPositiveEvent();
			})
			.catch(log);
		resetAction();
	};

	return {
		messageActionStore,
		roomScreen,
		messageComposerRef,
		listContainerRef,
		flatListRef,
		messageActionsRef,
		messageErrorActionsRef,
		onThreadPress,
		sendMessage,
		jumpToMessage: jumpToMessageByUrl,
		closeEmojiAndAction: handleCloseEmoji,
		errorActionsShow,
		onMessageLongPress,
		onEditInit,
		onEditCancel,
		onEditRequest,
		onQuoteInit,
		onRemoveQuoteMessage,
		onReactionInit,
		onReactionPress,
		onReplyInit
	};
}
