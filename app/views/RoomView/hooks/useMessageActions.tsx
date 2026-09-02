import { type RefObject } from 'react';

import { editMessage } from '../../../lib/methods/editMessage';
import log from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { getEmojiContent } from '../../../lib/methods/emojis';
import { setReaction } from '../../../lib/services/restApi';
import { getMessageById } from '../../../lib/database/services/Message';
import { type IEmoji, type IMessage, type IMessageEditAttachment, type TAnyMessageModel } from '../../../definitions';
import { type TActionSheetOptions } from '../../../containers/ActionSheet';
import { type IMessageComposerRef, type TEditRequest } from '../../../containers/MessageComposer/interfaces';
import { type IMessageActions } from '../../../containers/MessageActions';
import { type IMessageErrorActions } from '../../../containers/MessageErrorActions';
import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import ReactionPicker from '../components/ReactionPicker';

export interface IUseMessageActionsParams {
	messageActionStore: TMessageActionStore;
	showActionSheet: (options: TActionSheetOptions) => void;
	hideActionSheet: () => void;
	rid?: string;
	tmid?: string;
	onThreadPress: (item: TAnyMessageModel) => void;
	messageComposerRef: RefObject<IMessageComposerRef | null>;
	messageActionsRef: RefObject<IMessageActions | null>;
	messageErrorActionsRef: RefObject<IMessageErrorActions | null>;
}

export interface IUseMessageActionsResult {
	resetAction: () => void;
	handleCloseEmoji: (action?: (params?: unknown) => void, params?: unknown) => void;
	errorActionsShow: (message: TAnyMessageModel) => void;
	onEditInit: (messageId: string) => void;
	onEditCancel: () => void;
	onEditRequest: TEditRequest;
	onQuoteInit: (messageId: string) => void;
	onRemoveQuoteMessage: (messageId: string) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	onReactionInit: (messageId: string) => void;
	onMessageLongPress: (message: TAnyMessageModel) => void;
	onReplyInit: (messageId: string) => Promise<void>;
}

export function useMessageActions({
	messageActionStore,
	showActionSheet,
	hideActionSheet,
	rid,
	tmid,
	onThreadPress,
	messageComposerRef,
	messageActionsRef,
	messageErrorActionsRef
}: IUseMessageActionsParams): IUseMessageActionsResult {
	const resetAction = () => {
		messageActionStore.getState().actions.clear();
	};

	const onReactionClose = () => {
		resetAction();
		hideActionSheet();
	};

	const onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			await setReaction(getEmojiContent(emoji), messageId);
			onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	const handleCloseEmoji = (action?: (params?: unknown) => void, params?: unknown) => {
		if (messageComposerRef?.current) {
			return messageComposerRef.current.closeEmojiKeyboardAndAction(action, params);
		}
		action?.(params);
	};

	const errorActionsShow = (message: TAnyMessageModel) => {
		handleCloseEmoji(() => messageErrorActionsRef.current?.showMessageErrorActions(message));
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
		if (message.tmid && !tmid) {
			return;
		}
		handleCloseEmoji(() => messageActionsRef.current?.showMessageActions(message));
	};

	const onReplyInit = async (messageId: string) => {
		const message = await getMessageById(messageId);
		if (!message || !rid) {
			return;
		}
		onThreadPress(message);
	};

	return {
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
	};
}
