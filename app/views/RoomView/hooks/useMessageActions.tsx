import { useNavigation } from '@react-navigation/native';

import { editMessage } from '../../../lib/services/restApi';
import log from '../../../lib/methods/helpers/log';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { getMessageById } from '../../../lib/database/services/Message';
import { type IMessage, type IMessageEditAttachment, SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { type IRoomViewProps, type IUseMessageActionsParams, type IUseMessageActionsResult } from '../definitions';
import ReactionPicker from '../components/ReactionPicker';
import { useReactionActions } from './useReactionActions';

export function useMessageActions({
	messageActionStore,
	showActionSheet,
	hideActionSheet,
	rid,
	tmid,
	roomUserId,
	onThreadPress,
	messageComposerRef,
	messageActionsRef,
	messageErrorActionsRef
}: IUseMessageActionsParams): IUseMessageActionsResult {
	'use memo';

	const navigation = useNavigation<IRoomViewProps['navigation']>();

	const { resetAction, onReactionClose, onReactionPress } = useReactionActions({ messageActionStore, hideActionSheet });

	const handleCloseEmoji = (action?: Function, params?: any) => {
		if (messageComposerRef?.current) {
			return messageComposerRef.current.closeEmojiKeyboardAndAction(action, params);
		}
		if (action) {
			return action(params);
		}
	};

	const handleShowActionSheet = (options: any) => {
		handleCloseEmoji(showActionSheet, options);
	};

	const errorActionsShow = (message: TAnyMessageModel) => {
		handleCloseEmoji(messageErrorActionsRef.current?.showMessageErrorActions, message);
	};

	const onEditInit = (messageId: string) => {
		const { action, actions } = messageActionStore.getState();
		if (action) {
			return;
		}
		actions.startEditing(messageId);
	};

	const onEditCancel = () => {
		resetAction();
	};

	const onEditRequest = async (
		message: Pick<IMessage, 'id' | 'msg' | 'rid'> & {
			attachments?: IMessageEditAttachment[];
		}
	) => {
		try {
			resetAction();
			await editMessage(message);
		} catch (e) {
			log(e);
		}
	};

	const onQuoteInit = (messageId: string) => {
		const { action, actions } = messageActionStore.getState();
		if (action?.kind === 'quote') {
			if (!action.messageIds.includes(messageId)) {
				actions.addQuote(messageId);
			}
			return;
		}
		if (action) {
			return;
		}
		actions.startQuote(messageId);
	};

	const onRemoveQuoteMessage = (messageId: string) => {
		messageActionStore.getState().actions.removeQuote(messageId);
	};

	const showReactionPicker = () => {
		const { action } = messageActionStore.getState();
		const messageId = action?.kind === 'react' ? action.messageId : undefined;
		setTimeout(() => {
			showActionSheet({
				children: <ReactionPicker messageId={messageId} onEmojiSelected={onReactionPress} reactionClose={onReactionClose} />,
				snaps: ['50%'],
				enableContentPanningGesture: false,
				onClose: resetAction,
				fullContainer: true
			});
		}, 300);
	};

	const onReactionInit = (messageId: string) => {
		if (messageActionStore.getState().action) {
			return;
		}
		handleCloseEmoji(() => {
			messageActionStore.getState().actions.startReacting(messageId);
			showReactionPicker();
		});
	};

	const onMessageLongPress = (message: TAnyMessageModel) => {
		const { action } = messageActionStore.getState();
		if (action && action.kind !== 'quote') {
			return;
		}
		// if it's a thread message on main room, we disable the long press
		if (message.tmid && !tmid) {
			return;
		}
		handleCloseEmoji(messageActionsRef.current?.showMessageActions, message);
	};

	const onReplyInit = async (messageId: string) => {
		const message = await getMessageById(messageId);
		if (!message || !rid) {
			return;
		}
		// If there's a thread already, we redirect to it
		if (message.tlm) {
			return onThreadPress(message);
		}
		navigation.push('RoomView', {
			rid,
			tmid: messageId,
			name: makeThreadName(message),
			t: SubscriptionType.THREAD,
			roomUserId
		});
	};

	const setQuotesAndText = (text: string, quotes: string[]) => {
		messageActionStore.getState().actions.setQuoteMessageIds(quotes);
		messageComposerRef.current?.setInput(text || '');
	};

	const getText = () => messageComposerRef.current?.getText();

	return {
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
		onMessageLongPress,
		onReplyInit,
		setQuotesAndText,
		getText
	};
}
