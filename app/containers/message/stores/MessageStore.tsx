import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Keyboard } from 'react-native';

import { type IAttachment, type TAnyMessageModel } from '../../../definitions';
import { getMessageTranslation } from '../utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { messagesStatus } from '../../../lib/constants/messagesStatus';
import { useDebounce } from '../../../lib/methods/helpers/debounce';
import openLink from '../../../lib/methods/helpers/openLink';
import { useTheme } from '../../../theme';
import {
	useIsArchived,
	useAutoTranslate,
	useBroadcast,
	useCloseEmojiAndAction,
	useIsThreadRoom,
	useJumpToMessage,
	useMessageGroupingPeriod,
	useMessageUser,
	useOnDiscussionPress,
	useOnThreadPress
} from './MessageRoomStore';

type MessageStoreState = {
	tick: number;
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	isIgnored: boolean;
	manualUnignored: boolean;
	reveal: () => void;
	onPress?: () => void;
	onLongPress?: (item: TAnyMessageModel) => void;
	threadBadgeColor?: string;
};

const createMessageStore = (
	initial: Pick<MessageStoreState, 'item' | 'previousItem' | 'isIgnored' | 'onPress' | 'onLongPress' | 'threadBadgeColor'>
) =>
	createStore<MessageStoreState>(set => ({
		tick: 0,
		manualUnignored: false,
		reveal: () => set({ manualUnignored: true }),
		...initial
	}));

type MessageStore = ReturnType<typeof createMessageStore>;

const MessageStoreContext = createContext<MessageStore | null>(null);

const useMessageStore = <T,>(selector: (state: MessageStoreState) => T): T => {
	const store = useContext(MessageStoreContext);
	if (!store) {
		throw new Error('Message hooks must be used within a MessageProvider');
	}
	return useStore(store, selector);
};

export const useMessageItem = (): TAnyMessageModel => useMessageStore(s => s.item);

// The selector must return a referentially stable value for an unchanged field (Object.is bail);
// for multiple fields use a focused domain hook with useShallow, never call this hook repeatedly.
// Stability of JSON fields depends on the model's @json(..., { memo: true }) decorators
// (app/lib/database/model/Message.js); a field that drops memo:true returns a fresh ref every
// access and would defeat both the Object.is and useShallow bail.
export const useMessageField = <T,>(selector: (item: TAnyMessageModel) => T): T => useMessageStore(s => selector(s.item));

// Plain REST objects (no experimentalSubscribe) never emit again after the initial render.
const subscribeModel = (m: TAnyMessageModel, store: MessageStore) => {
	if (typeof m.experimentalSubscribe !== 'function') return undefined;
	return m.experimentalSubscribe(() => store.setState(s => ({ tick: s.tick + 1 })));
};

export const MessageProvider = ({
	item,
	previousItem,
	onPress,
	onLongPress,
	threadBadgeColor,
	isIgnored,
	children
}: {
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	onPress?: () => void;
	onLongPress?: (item: TAnyMessageModel) => void;
	threadBadgeColor?: string;
	isIgnored?: boolean;
	children: ReactNode;
}): ReactElement => {
	'use memo';

	const [store] = useState(() =>
		createMessageStore({ item, previousItem, isIgnored: isIgnored ?? false, onPress, onLongPress, threadBadgeColor })
	);

	// Header grouping and thread position depend on the previous record too, so each effect
	// subscribes one record; both feed the same tick. Keeping them separate means changing
	// previousItem does not tear down and recreate item's subscription.
	useEffect(() => subscribeModel(item, store), [item, store]);
	useEffect(() => (previousItem ? subscribeModel(previousItem, store) : undefined), [previousItem, store]);

	// Mirror per-message row handlers so field-level selectors subscribe without churning the context value.
	useEffect(() => {
		store.setState({ onPress, onLongPress, threadBadgeColor });
	}, [onPress, onLongPress, threadBadgeColor, store]);

	// Push item/previousItem prop changes into the store so field selectors re-read (temp→server swap, neighbour changes).
	useEffect(() => {
		store.setState({ item, previousItem });
	}, [item, previousItem, store]);

	// Reset the manual reveal only when the ignore state actually transitions.
	useEffect(() => {
		store.setState({ isIgnored: isIgnored ?? false, manualUnignored: false });
	}, [isIgnored, store]);

	return <MessageStoreContext.Provider value={store}>{children}</MessageStoreContext.Provider>;
};

export const useReactions = (): TAnyMessageModel['reactions'] => useMessageField(item => item.reactions);

export const useUrls = (): TAnyMessageModel['urls'] => useMessageField(item => item.urls);

export const useBlocks = (): Pick<TAnyMessageModel, 'blocks' | 'id'> =>
	useMessageStore(useShallow(s => ({ blocks: s.item.blocks, id: s.item.id })));

export const useDiscussion = (): Pick<TAnyMessageModel, 'dcount' | 'dlm'> =>
	useMessageStore(useShallow(s => ({ dcount: s.item.dcount, dlm: s.item.dlm })));

export const useThreadData = (): Pick<TAnyMessageModel, 'tcount' | 'tlm' | 'tmid' | 'id'> =>
	useMessageStore(useShallow(s => ({ tcount: s.item.tcount, tlm: s.item.tlm, tmid: s.item.tmid, id: s.item.id })));

export const useRepliedThreadData = (): Pick<TAnyMessageModel, 'tmid' | 'tmsg' | 'id'> =>
	useMessageStore(useShallow(s => ({ tmid: s.item.tmid, tmsg: s.item.tmsg, id: s.item.id })));

export const useMessageAuthor = (): Pick<TAnyMessageModel, 'u' | 'alias' | 'role'> =>
	useMessageStore(useShallow(s => ({ u: s.item.u, alias: s.item.alias, role: s.item.role })));

export const useAvatar = (): Pick<TAnyMessageModel, 'avatar' | 'emoji'> =>
	useMessageStore(useShallow(s => ({ avatar: s.item.avatar, emoji: s.item.emoji })));

export const useContentData = (): Pick<TAnyMessageModel, 'md' | 'mentions' | 'channels' | 'comment' | 'attachments' | 't'> =>
	useMessageStore(
		useShallow(s => ({
			md: s.item.md,
			mentions: s.item.mentions,
			channels: s.item.channels,
			comment: s.item.comment,
			attachments: s.item.attachments,
			t: s.item.t
		}))
	);

export const useInfoData = (): Pick<TAnyMessageModel, 't' | 'comment'> =>
	useMessageStore(useShallow(s => ({ t: s.item.t, comment: s.item.comment })));

export const useMarkdownData = (): Pick<TAnyMessageModel, 'md' | 'mentions' | 'channels' | 't'> =>
	useMessageStore(useShallow(s => ({ md: s.item.md, mentions: s.item.mentions, channels: s.item.channels, t: s.item.t })));

export const useAttachments = (): TAnyMessageModel['attachments'] => useMessageField(item => item.attachments);

export const useMessageHeaderMeta = (): Pick<TAnyMessageModel, 'ts' | 'unread' | 'pinned' | 't'> =>
	useMessageStore(useShallow(s => ({ ts: s.item.ts, unread: s.item.unread, pinned: s.item.pinned, t: s.item.t })));

const computeIsHeader = (
	prev: TAnyMessageModel | undefined,
	item: TAnyMessageModel,
	broadcast: boolean,
	Message_GroupingPeriod: number | undefined,
	hasError: boolean
): boolean => {
	if (hasError || (prev && prev.status === messagesStatus.ERROR)) {
		return true;
	}
	// Grouping only applies to DB models with a Date ts; REST-sourced messages carry a string ts and are always headers.
	if (!prev || Message_GroupingPeriod == null || !(prev.ts instanceof Date) || !(item.ts instanceof Date)) {
		return true;
	}
	if (
		prev.ts.toDateString() === item.ts.toDateString() &&
		prev.u?.username === item.u?.username &&
		!(prev.groupable === false || item.groupable === false || broadcast === true) &&
		item.ts.getTime() - prev.ts.getTime() < Message_GroupingPeriod * 1000 &&
		prev.tmid === item.tmid &&
		item.t !== 'rm' &&
		prev.t !== 'rm'
	) {
		return false;
	}
	return true;
};

export const useMessageGrouping = (): boolean => {
	const broadcast = useBroadcast();
	const Message_GroupingPeriod = useMessageGroupingPeriod();
	return useMessageStore(s =>
		computeIsHeader(s.previousItem, s.item, !!broadcast, Message_GroupingPeriod, s.item.status === messagesStatus.ERROR)
	);
};

export const useThreadPosition = (): { isThreadReply: boolean; isThreadSequential: boolean } => {
	const isThreadRoom = useIsThreadRoom();
	return useMessageStore(
		useShallow(s => {
			if (isThreadRoom) {
				return { isThreadReply: false, isThreadSequential: false };
			}
			const isThreadReply = !!(
				s.previousItem &&
				s.item.tmid &&
				s.previousItem.tmid !== s.item.tmid &&
				s.previousItem.id !== s.item.tmid
			);
			return { isThreadReply, isThreadSequential: !!s.item.tmid };
		})
	);
};

export const useMessageStatus = (): { hasError: boolean; isTemp: boolean } =>
	useMessageStore(
		useShallow(s => ({
			hasError: s.item.status === messagesStatus.ERROR,
			isTemp: s.item.status === messagesStatus.TEMP || s.item.status === messagesStatus.ERROR
		}))
	);

export const useIsEncrypted = (): boolean => useMessageField(item => item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE);

export const useIsInfoMessage = (): boolean =>
	useMessageField(item => {
		if (['e2e', 'discussion-created', 'jitsi_call_started', 'videoconf'].includes(item.t as string)) {
			return false;
		}
		return !!item.t;
	});

export const useIsEdited = (): boolean => useMessageField(item => (item.editedBy && !!item.editedBy.username) ?? false);

export const useMessageId = (): TAnyMessageModel['id'] => useMessageField(item => item.id);

export const useReplies = (): TAnyMessageModel['replies'] => useMessageField(item => item.replies);

export const useTranslateLanguage = (): string | undefined => {
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	const user = useMessageUser();
	return useMessageStore(s => {
		const otherUserMessage = s.item.u?.username !== user?.username;
		const canTranslate = autoTranslateRoom && autoTranslateLanguage && s.item.autoTranslate !== false && otherUserMessage;
		return canTranslate ? autoTranslateLanguage : undefined;
	});
};

export const useMessageText = (): { messageText: TAnyMessageModel['msg']; isTranslated: boolean } => {
	const user = useMessageUser();
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	return useMessageStore(
		useShallow(s => {
			let messageText = s.item.msg;
			let isTranslated = false;
			const otherUserMessage = s.item.u?.username !== user?.username;
			if (autoTranslateRoom && s.item.autoTranslate && autoTranslateLanguage && otherUserMessage) {
				const translated = getMessageTranslation(s.item, autoTranslateLanguage);
				isTranslated = !!translated;
				messageText = translated || messageText;
			}
			return { messageText, isTranslated };
		})
	);
};

export const useThreadBadgeColor = (): string | undefined => useMessageStore(s => s.threadBadgeColor);

export const useMessageIgnored = (): boolean => useMessageStore(s => (s.manualUnignored ? false : s.isIgnored));

export const useRevealIgnored = (): (() => void) => useMessageStore(s => s.reveal);

export const useMessageLongPress = (): (() => void) => {
	'use memo';

	const item = useMessageItem();
	const isInfo = useIsInfoMessage();
	const { hasError } = useMessageStatus();
	const isEncrypted = useIsEncrypted();
	const archived = useIsArchived();
	const onLongPress = useMessageStore(s => s.onLongPress);
	return () => {
		if (isInfo || hasError || isEncrypted || archived) {
			return;
		}
		onLongPress?.(item);
	};
};

export const useOnLinkPress = (): ((link: string) => void) => {
	'use memo';

	const item = useMessageItem();
	const jumpToMessage = useJumpToMessage();
	const { theme } = useTheme();
	return (link: string) => {
		const isMessageLink = !!item.attachments?.some((att: IAttachment) => att?.message_link === link);
		if (isMessageLink && jumpToMessage) {
			return jumpToMessage(link);
		}
		openLink(link, theme);
	};
};

export const useMessagePress = (): (() => void) => {
	'use memo';

	const item = useMessageItem();
	const isThreadRoom = useIsThreadRoom();
	const onPress = useMessageStore(s => s.onPress);
	const onThreadPress = useOnThreadPress();
	const onDiscussionPress = useOnDiscussionPress();
	const closeEmojiAndAction = useCloseEmojiAndAction();
	const isIgnored = useMessageIgnored();
	const revealIgnored = useRevealIgnored();

	const handlePress = useDebounce(
		() => {
			if (isIgnored) {
				return revealIgnored();
			}
			if (onPress) {
				return onPress();
			}
			Keyboard.dismiss();
			if ((item.tlm || item.tmid) && !isThreadRoom) {
				onThreadPress?.(item);
			}
			if (item.dlm && onDiscussionPress) {
				onDiscussionPress(item);
			}
		},
		300,
		{ leading: true, trailing: false }
	);

	return () => {
		if (closeEmojiAndAction) {
			return closeEmojiAndAction(handlePress);
		}
		return handlePress();
	};
};
