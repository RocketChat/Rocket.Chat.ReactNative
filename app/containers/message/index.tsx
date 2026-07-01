import { memo, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import Message from './Message';
import MessageContext from './Context';
import { debounce } from '../../lib/methods/helpers';
import { type TSupportedThemes, useTheme } from '../../theme';
import openLink from '../../lib/methods/helpers/openLink';
import { type IAttachment, type TAnyMessageModel, type TGetCustomEmoji } from '../../definitions';
import { type IRoomInfoParam } from '../../views/SearchMessagesView';
import MessageSeparator from '../MessageSeparator';
import { useIsBeingEdited } from '../../views/RoomView/InteractionStore';
import { MessageProvider, type MessagePrev, useIsEncrypted, useIsInfo, useMessageStatus } from './MessageStore';

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

// `item` is intentionally omitted: the FlatList keys each row by item.id, so a
// different message remounts rather than re-rendering with a new item prop; in-place
// field updates on the same item are handled by the per-message Zustand store (see
// MessageProvider/MessageStore), not by this comparison.
function areEqual(prev: IMessageContainerProps, next: IMessageContainerProps): boolean {
	const p = prev.previousItem;
	const n = next.previousItem;
	return (
		prev.showUnreadSeparator === next.showUnreadSeparator &&
		prev.dateSeparator === next.dateSeparator &&
		prev.highlighted === next.highlighted &&
		prev.threadBadgeColor === next.threadBadgeColor &&
		prev.isIgnored === next.isIgnored &&
		p?.id === n?.id &&
		p?.status === n?.status &&
		p?.ts === n?.ts &&
		p?.u?.username === n?.u?.username &&
		p?.groupable === n?.groupable &&
		p?.tmid === n?.tmid &&
		p?.t === n?.t &&
		prev.autoTranslateRoom === next.autoTranslateRoom &&
		prev.autoTranslateLanguage === next.autoTranslateLanguage
	);
}

const MessageContainerInner = ({
	item,
	user,
	rid,
	timeFormat,
	archived = false,
	broadcast = false,
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

	const isBeingEdited = useIsBeingEdited(item.id);
	const { theme } = useTheme();
	const [isManualUnignored, setIsManualUnignored] = useState(false);

	// Sourced via the per-message store (rather than read directly off `item`) so this
	// component re-renders and refreshes the Context value/closures below when they change.
	const { hasError } = useMessageStatus();
	const isEncrypted = useIsEncrypted();
	const isInfo = useIsInfo();

	const isIgnored = isManualUnignored ? false : isIgnoredProp ?? false;

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
			onReactionPressProp(emoji, item.id);
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
			reactionInitProp(item.id);
		}
	};

	const replyBroadcast = () => {
		if (replyBroadcastProp) {
			replyBroadcastProp(item);
		}
	};

	const onLinkPress = (link: string): void => {
		const isMessageLink = !!item.attachments?.some((att: IAttachment) => att?.message_link === link);
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

	// pressHandlerRef holds the latest press logic; updated after every render via
	// useEffect so the render body stays free of ref writes.
	const pressHandlerRef = useRef<() => void>(() => {});
	useEffect(() => {
		pressHandlerRef.current = () => {
			if (isIgnored) {
				return onIgnoredMessagePress();
			}

			if (onPressProp) {
				return onPressProp();
			}

			Keyboard.dismiss();

			if ((item.tlm || item.tmid) && !isThreadRoom) {
				onThreadPress();
			}

			if (item.dlm && onDiscussionPressProp) {
				onDiscussionPressProp(item);
			}
		};
	});
	// onPressRef holds the single debounced instance for the component lifetime.
	// Initialised to a noop; replaced with the real debounced fn in the first effect
	// so that pressHandlerRef.current is never read during render.
	const onPressRef = useRef(debounce(() => {}, 300, true));
	useEffect(() => {
		onPressRef.current = debounce(() => pressHandlerRef.current?.(), 300, true);
	}, []);

	const onPressAction = () => {
		if (closeEmojiAndAction) {
			return closeEmojiAndAction(onPressRef.current);
		}
		return onPressRef.current();
	};

	const otherUserMessage = item.u?.username !== user?.username;
	const canTranslateMessage = autoTranslateRoom && autoTranslateLanguage && item.autoTranslate !== false && otherUserMessage;

	return (
		<MessageContext.Provider
			value={{
				id: item.id,
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
				replies: item.replies,
				translateLanguage: canTranslateMessage ? autoTranslateLanguage : undefined,
				isEncrypted,
				getCustomEmoji,
				navToRoomInfo,
				showAttachment,
				blockAction,
				handleEnterCall,
				fetchThreadName,
				broadcast,
				Message_GroupingPeriod,
				isThreadRoom: !!isThreadRoom,
				autoTranslateRoom,
				autoTranslateLanguage
			}}>
			<Message
				rid={rid}
				timeFormat={timeFormat}
				archived={archived}
				broadcast={broadcast}
				useRealName={useRealName}
				isReadReceiptEnabled={isReadReceiptEnabled}
				isThreadRoom={!!isThreadRoom}
				isPreview={isPreview}
				highlighted={highlighted}
				isIgnored={isIgnored}
				isBeingEdited={isBeingEdited}
				autoTranslateLanguage={autoTranslateLanguage}
			/>
			<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
		</MessageContext.Provider>
	);
};

const MessageContainer = (props: IMessageContainerProps) => {
	'use memo';

	const { item, previousItem } = props;
	const prev: MessagePrev | undefined = previousItem
		? {
				id: previousItem.id,
				status: previousItem.status,
				ts: previousItem.ts,
				username: previousItem.u?.username,
				groupable: previousItem.groupable,
				tmid: previousItem.tmid,
				t: previousItem.t
		  }
		: undefined;
	return (
		<MessageProvider item={item} prev={prev}>
			<MessageContainerInner {...props} />
		</MessageProvider>
	);
};

export default memo(MessageContainer, areEqual);
