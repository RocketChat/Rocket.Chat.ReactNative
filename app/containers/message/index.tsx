import { memo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import Message from './Message';
import MessageContext from './Context';
import { debounce } from '../../lib/methods/helpers';
import { getMessageTranslation } from './utils';
import { type TSupportedThemes, useTheme } from '../../theme';
import openLink from '../../lib/methods/helpers/openLink';
import { type IAttachment, type TAnyMessageModel, type TGetCustomEmoji } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/constants/keys';
import { messagesStatus } from '../../lib/constants/messagesStatus';
import MessageSeparator from '../MessageSeparator';
import { useMessage } from './hooks/useMessage';
import { useIsBeingEdited } from '../../views/RoomView/InteractionStore';

interface IMessageContainerProps {
	item: TAnyMessageModel;
	user: {
		id: string;
		username: string;
		token: string;
	};
	msg?: string;
	rid: string;
	timeFormat?: string;
	archived?: boolean;
	broadcast?: boolean;
	previousItem?: TAnyMessageModel;
	baseUrl: string;
	Message_GroupingPeriod?: number;
	isReadReceiptEnabled?: boolean;
	isThreadRoom?: boolean;
	isSystemMessage?: boolean;
	useRealName?: boolean;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
	status?: number;
	isIgnored?: boolean;
	highlighted?: boolean;
	getCustomEmoji: TGetCustomEmoji;
	onLongPress?: (item: TAnyMessageModel) => void;
	onReactionPress?: (emoji: string, id: string) => void;
	onEncryptedPress?: () => void;
	onDiscussionPress?: (item: TAnyMessageModel) => void;
	onThreadPress?: (item: TAnyMessageModel) => void;
	errorActionsShow?: (item: TAnyMessageModel) => void;
	replyBroadcast?: (item: TAnyMessageModel) => void;
	reactionInit?: (messageId: string) => void;
	fetchThreadName?: (tmid: string, id: string) => Promise<string | undefined>;
	showAttachment?: (file: IAttachment) => void;
	onReactionLongPress?: (item: TAnyMessageModel) => void;
	navToRoomInfo?: (navParam: IRoomInfoParam) => void;
	handleEnterCall?: () => void;
	blockAction?: (params: { actionId: string; appId: string; value: string; blockId: string; rid: string; mid: string }) => void;
	onAnswerButtonPress?: Function;
	threadBadgeColor?: string;
	toggleFollowThread?: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	jumpToMessage?: (link: string) => void;
	onPress?: () => void;
	theme?: TSupportedThemes;
	closeEmojiAndAction?: (action?: Function, params?: any) => void;
	isPreview?: boolean;
	dateSeparator?: Date | string | null;
	showUnreadSeparator?: boolean;
}

function areEqual(prev: IMessageContainerProps, next: IMessageContainerProps): boolean {
	return (
		prev.showUnreadSeparator === next.showUnreadSeparator &&
		prev.dateSeparator === next.dateSeparator &&
		prev.highlighted === next.highlighted &&
		prev.threadBadgeColor === next.threadBadgeColor &&
		prev.isIgnored === next.isIgnored &&
		prev.previousItem?._id === next.previousItem?._id &&
		prev.autoTranslateRoom === next.autoTranslateRoom &&
		prev.autoTranslateLanguage === next.autoTranslateLanguage
	);
}

const MessageContainer = ({
	item,
	user,
	rid,
	timeFormat,
	archived = false,
	broadcast = false,
	previousItem,
	baseUrl,
	Message_GroupingPeriod,
	isReadReceiptEnabled,
	isThreadRoom,
	useRealName,
	autoTranslateRoom,
	autoTranslateLanguage,
	isIgnored: isIgnoredProp = false,
	highlighted,
	getCustomEmoji = () => null,
	onLongPress: onLongPressProp = () => {},
	onReactionPress: onReactionPressProp,
	onEncryptedPress: onEncryptedPressProp,
	onDiscussionPress: onDiscussionPressProp,
	onThreadPress: onThreadPressProp,
	errorActionsShow,
	replyBroadcast: replyBroadcastProp,
	reactionInit: reactionInitProp,
	fetchThreadName,
	showAttachment,
	onReactionLongPress: onReactionLongPressProp,
	navToRoomInfo = () => {},
	handleEnterCall,
	blockAction = () => {},
	onAnswerButtonPress: onAnswerButtonPressProp,
	threadBadgeColor,
	toggleFollowThread,
	jumpToMessage,
	onPress: onPressProp,
	closeEmojiAndAction,
	isPreview,
	dateSeparator,
	showUnreadSeparator
}: IMessageContainerProps) => {
	'use memo';

	const message = useMessage(item);
	const isBeingEdited = useIsBeingEdited(item.id);
	const { theme } = useTheme();
	const [isManualUnignored, setIsManualUnignored] = useState(false);

	// Derived values (formerly getters)
	const hasError = message.status === messagesStatus.ERROR;

	const isHeader = (() => {
		if (hasError || (previousItem && previousItem.status === messagesStatus.ERROR)) {
			return true;
		}
		try {
			if (
				previousItem &&
				// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
				previousItem.ts.toDateString() === message.ts.toDateString() &&
				previousItem.u?.username === message.u?.username &&
				!(previousItem.groupable === false || message.groupable === false || broadcast === true) &&
				// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
				message.ts - previousItem.ts < Message_GroupingPeriod * 1000 &&
				previousItem.tmid === message.tmid &&
				message.t !== 'rm' &&
				previousItem.t !== 'rm'
			) {
				return false;
			}
			return true;
		} catch (error) {
			return true;
		}
	})();

	const isThreadReply = (() => {
		if (isThreadRoom) {
			return false;
		}
		if (previousItem && message.tmid && previousItem.tmid !== message.tmid && previousItem.id !== message.tmid) {
			return true;
		}
		return false;
	})();

	const isThreadSequential = (() => {
		if (isThreadRoom) {
			return false;
		}
		return !!message.tmid;
	})();

	const isEncrypted = message.t === E2E_MESSAGE_TYPE && message.e2e !== E2E_STATUS.DONE;

	const isInfo: string | boolean = (() => {
		if (['e2e', 'discussion-created', 'jitsi_call_started', 'videoconf'].includes(message.t)) {
			return false;
		}
		return message.t;
	})();

	const isTemp = message.status === messagesStatus.TEMP || message.status === messagesStatus.ERROR;

	const isIgnored = isManualUnignored ? false : isIgnoredProp ?? false;

	// Event handlers
	const onIgnoredMessagePress = () => {
		setIsManualUnignored(true);
	};

	const onErrorPress = () => {
		if (errorActionsShow) {
			errorActionsShow(item);
		}
	};

	const onReactionPress = (emoji: string) => {
		if (onReactionPressProp) {
			onReactionPressProp(emoji, message.id);
		}
	};

	const onReactionLongPress = () => {
		if (onReactionLongPressProp) {
			onReactionLongPressProp(item);
		}
	};

	const onEncryptedPress = () => {
		if (onEncryptedPressProp) {
			onEncryptedPressProp();
		}
	};

	const onDiscussionPress = () => {
		if (onDiscussionPressProp) {
			onDiscussionPressProp(item);
		}
	};

	const onThreadPress = () => {
		if (onThreadPressProp) {
			onThreadPressProp(item);
		}
	};

	const onAnswerButtonPress = (msg: string) => {
		if (onAnswerButtonPressProp) {
			onAnswerButtonPressProp(msg, false);
		}
	};

	const reactionInit = () => {
		if (reactionInitProp) {
			reactionInitProp(message.id);
		}
	};

	const replyBroadcast = () => {
		if (replyBroadcastProp) {
			replyBroadcastProp(item);
		}
	};

	const onLinkPress = (link: string): void => {
		const isMessageLink = message.attachments?.findIndex((att: IAttachment) => att?.message_link === link) !== -1;
		if (isMessageLink && jumpToMessage) {
			return jumpToMessage(link);
		}
		openLink(link, theme);
	};

	const onLongPress = () => {
		if (isInfo || hasError || isEncrypted || archived) {
			return;
		}
		if (onLongPressProp) {
			onLongPressProp(item);
		}
	};

	// Stable debounced onPress — one instance for the component lifetime,
	// always invoking the latest closure via the ref.
	const pressHandlerRef = useRef<() => void>(() => {});
	pressHandlerRef.current = () => {
		if (isIgnored) {
			return onIgnoredMessagePress();
		}

		if (onPressProp) {
			return onPressProp();
		}

		Keyboard.dismiss();

		if ((message.tlm || message.tmid) && !isThreadRoom) {
			onThreadPress();
		}

		if (message.dlm && onDiscussionPressProp) {
			onDiscussionPressProp(item);
		}
	};
	const onPress = useRef(debounce(() => pressHandlerRef.current(), 300, true)).current;

	const onPressAction = () => {
		if (closeEmojiAndAction) {
			return closeEmojiAndAction(onPress);
		}
		return onPress();
	};

	const {
		id,
		msg,
		ts,
		attachments,
		urls,
		reactions,
		t,
		avatar,
		emoji,
		u,
		alias,
		editedBy,
		role,
		drid,
		dcount,
		dlm,
		tmid,
		tcount,
		tlm,
		tmsg,
		mentions,
		channels,
		unread,
		blocks,
		autoTranslate: autoTranslateMessage,
		replies,
		md,
		comment,
		pinned
	} = message;

	let messageText = msg;
	let isTranslated = false;
	const otherUserMessage = u?.username !== user?.username;
	if (autoTranslateRoom && autoTranslateMessage && autoTranslateLanguage && otherUserMessage) {
		const messageTranslated = getMessageTranslation(item, autoTranslateLanguage);
		isTranslated = !!messageTranslated;
		messageText = messageTranslated || messageText;
	}

	const canTranslateMessage = autoTranslateRoom && autoTranslateLanguage && autoTranslateMessage !== false && otherUserMessage;

	return (
		<MessageContext.Provider
			value={{
				id,
				rid,
				user,
				baseUrl,
				onPress: onPressAction,
				onLongPress,
				reactionInit,
				onErrorPress,
				replyBroadcast,
				onReactionPress,
				onEncryptedPress,
				onDiscussionPress,
				onThreadPress,
				onReactionLongPress,
				onLinkPress,
				onAnswerButtonPress,
				jumpToMessage,
				threadBadgeColor,
				toggleFollowThread,
				replies,
				translateLanguage: canTranslateMessage ? autoTranslateLanguage : undefined,
				isEncrypted,
				getCustomEmoji,
				navToRoomInfo,
				showAttachment,
				blockAction,
				handleEnterCall,
				fetchThreadName
			}}>
			<Message
				id={id}
				msg={messageText}
				md={md}
				rid={rid}
				author={u}
				ts={ts}
				type={t}
				attachments={attachments}
				blocks={blocks}
				urls={urls}
				reactions={reactions}
				alias={alias}
				avatar={avatar}
				emoji={emoji}
				timeFormat={timeFormat}
				archived={archived}
				broadcast={broadcast}
				useRealName={useRealName}
				isReadReceiptEnabled={isReadReceiptEnabled}
				unread={unread}
				role={role}
				drid={drid}
				dcount={dcount}
				dlm={dlm}
				tmid={tmid}
				tcount={tcount}
				tlm={tlm}
				tmsg={tmsg}
				mentions={mentions}
				channels={channels}
				isIgnored={isIgnored}
				isEdited={(editedBy && !!editedBy.username) ?? false}
				isHeader={isHeader}
				isThreadReply={isThreadReply}
				isThreadSequential={isThreadSequential}
				isThreadRoom={!!isThreadRoom}
				isInfo={isInfo}
				isTemp={isTemp}
				isEncrypted={isEncrypted}
				hasError={hasError}
				highlighted={highlighted}
				comment={comment}
				isTranslated={isTranslated}
				isBeingEdited={isBeingEdited}
				isPreview={isPreview}
				pinned={pinned}
				autoTranslateLanguage={autoTranslateLanguage}
			/>
			<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
		</MessageContext.Provider>
	);
};

export default memo(MessageContainer, areEqual);
