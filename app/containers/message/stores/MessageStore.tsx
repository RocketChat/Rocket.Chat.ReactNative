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
	useArchived,
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
	manualUnignored: boolean;
	onPress?: () => void;
	onLongPress?: (item: TAnyMessageModel) => void;
	threadBadgeColor?: string;
};

const createMessageStore = (initial: Partial<MessageStoreState>) =>
	createStore<MessageStoreState>(() => ({ tick: 0, manualUnignored: false, ...initial }));

type MessageStore = ReturnType<typeof createMessageStore>;

type MessageCtxValue = {
	store: MessageStore;
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	revealIgnored: () => void;
	isIgnored: boolean;
};

const MessageStoreContext = createContext<MessageCtxValue | null>(null);

export const useMessageCtx = (): MessageCtxValue => {
	const ctx = useContext(MessageStoreContext);
	if (!ctx) {
		throw new Error('Message hooks must be used within a MessageProvider');
	}
	return ctx;
};

// The selector must return a referentially stable value for an unchanged field (Object.is bail);
// for multiple fields use a focused domain hook with useShallow, never call this hook repeatedly.
// Stability of JSON fields depends on the model's @json(..., { memo: true }) decorators
// (app/lib/database/model/Message.js); a field that drops memo:true returns a fresh ref every
// access and would defeat both the Object.is and useShallow bail.
export const useMessageField = <T,>(selector: (item: TAnyMessageModel) => T): T => {
	const { store, item } = useMessageCtx();
	return useStore(store, () => selector(item));
};

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

	const [store] = useState(() => createMessageStore({ onPress, onLongPress, threadBadgeColor }));

	// Header grouping and thread position depend on the previous record too, so each effect
	// subscribes one record; both feed the same tick. Keeping them separate means changing
	// previousItem does not tear down and recreate item's subscription.
	useEffect(() => subscribeModel(item, store), [item, store]);
	useEffect(() => (previousItem ? subscribeModel(previousItem, store) : undefined), [previousItem, store]);

	// Mirror per-message row handlers so field-level selectors subscribe without churning the context value.
	useEffect(() => {
		store.setState({ onPress, onLongPress, threadBadgeColor });
	});

	const revealIgnored = () => store.setState({ manualUnignored: true });

	return (
		<MessageStoreContext.Provider value={{ store, item, previousItem, revealIgnored, isIgnored: isIgnored ?? false }}>
			{children}
		</MessageStoreContext.Provider>
	);
};

export const useReactions = (): TAnyMessageModel['reactions'] => useMessageField(item => item.reactions);

export const useUrls = (): TAnyMessageModel['urls'] => useMessageField(item => item.urls);

export const useBlocks = (): Pick<TAnyMessageModel, 'blocks' | 'id'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ blocks: item.blocks, id: item.id }))
	);
};

export const useDiscussion = (): Pick<TAnyMessageModel, 'dcount' | 'dlm'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ dcount: item.dcount, dlm: item.dlm }))
	);
};

export const useThreadData = (): Pick<TAnyMessageModel, 'tcount' | 'tlm' | 'tmid' | 'id'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ tcount: item.tcount, tlm: item.tlm, tmid: item.tmid, id: item.id }))
	);
};

export const useRepliedThreadData = (): Pick<TAnyMessageModel, 'tmid' | 'tmsg' | 'id'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ tmid: item.tmid, tmsg: item.tmsg, id: item.id }))
	);
};

export const useMessageAuthor = (): Pick<TAnyMessageModel, 'u' | 'alias' | 'role'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ u: item.u, alias: item.alias, role: item.role }))
	);
};

export const useAvatar = (): Pick<TAnyMessageModel, 'avatar' | 'emoji'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ avatar: item.avatar, emoji: item.emoji }))
	);
};

export const useContentData = (): Pick<TAnyMessageModel, 'md' | 'mentions' | 'channels' | 'comment' | 'attachments' | 't'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({
			md: item.md,
			mentions: item.mentions,
			channels: item.channels,
			comment: item.comment,
			attachments: item.attachments,
			t: item.t
		}))
	);
};

export const useMessageHeaderMeta = (): Pick<TAnyMessageModel, 'ts' | 'unread' | 'pinned' | 't'> => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({ ts: item.ts, unread: item.unread, pinned: item.pinned, t: item.t }))
	);
};

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
	try {
		if (
			prev &&
			// @ts-expect-error IMessage types ts as Date, IMessageFromServer as string; the date op is valid at runtime
			prev.ts.toDateString() === item.ts.toDateString() &&
			prev.u?.username === item.u?.username &&
			!(prev.groupable === false || item.groupable === false || broadcast === true) &&
			// @ts-expect-error IMessage types ts as Date, IMessageFromServer as string; the date op is valid at runtime
			item.ts - prev.ts < Message_GroupingPeriod * 1000 &&
			prev.tmid === item.tmid &&
			item.t !== 'rm' &&
			prev.t !== 'rm'
		) {
			return false;
		}
		return true;
	} catch {
		return true;
	}
};

export const useMessageGrouping = (): boolean => {
	const { store, item, previousItem } = useMessageCtx();
	const broadcast = useBroadcast();
	const Message_GroupingPeriod = useMessageGroupingPeriod();
	return useStore(store, () =>
		computeIsHeader(previousItem, item, !!broadcast, Message_GroupingPeriod, item.status === messagesStatus.ERROR)
	);
};

export const useThreadPosition = (): { isThreadReply: boolean; isThreadSequential: boolean } => {
	const { store, item, previousItem } = useMessageCtx();
	const isThreadRoom = useIsThreadRoom();
	return useStore(
		store,
		useShallow(() => {
			if (isThreadRoom) {
				return { isThreadReply: false, isThreadSequential: false };
			}
			const isThreadReply = !!(previousItem && item.tmid && previousItem.tmid !== item.tmid && previousItem.id !== item.tmid);
			return { isThreadReply, isThreadSequential: !!item.tmid };
		})
	);
};

export const useMessageStatus = (): { hasError: boolean; isTemp: boolean } => {
	const { store, item } = useMessageCtx();
	return useStore(
		store,
		useShallow(() => ({
			hasError: item.status === messagesStatus.ERROR,
			isTemp: item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR
		}))
	);
};

export const useIsEncrypted = (): boolean => useMessageField(item => item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE);

export const useIsInfo = (): string | boolean =>
	useMessageField(item => {
		if (['e2e', 'discussion-created', 'jitsi_call_started', 'videoconf'].includes(item.t as string)) {
			return false;
		}
		return item.t;
	});

export const useIsEdited = (): boolean => useMessageField(item => (item.editedBy && !!item.editedBy.username) ?? false);

export const useMessageId = (): TAnyMessageModel['id'] => useMessageField(item => item.id);

export const useReplies = (): TAnyMessageModel['replies'] => useMessageField(item => item.replies);

export const useTranslateLanguage = (): string | undefined => {
	const { store, item } = useMessageCtx();
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	const user = useMessageUser();
	return useStore(store, () => {
		const otherUserMessage = item.u?.username !== user?.username;
		const canTranslate = autoTranslateRoom && autoTranslateLanguage && item.autoTranslate !== false && otherUserMessage;
		return canTranslate ? autoTranslateLanguage : undefined;
	});
};

export const useMessageText = (): { messageText: TAnyMessageModel['msg']; isTranslated: boolean } => {
	const { store, item } = useMessageCtx();
	const user = useMessageUser();
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	return useStore(
		store,
		useShallow(() => {
			let messageText = item.msg;
			let isTranslated = false;
			const otherUserMessage = item.u?.username !== user?.username;
			if (autoTranslateRoom && item.autoTranslate && autoTranslateLanguage && otherUserMessage) {
				const translated = getMessageTranslation(item, autoTranslateLanguage);
				isTranslated = !!translated;
				messageText = translated || messageText;
			}
			return { messageText, isTranslated };
		})
	);
};

export const useThreadBadgeColor = (): string | undefined => {
	const { store } = useMessageCtx();
	return useStore(store, s => s.threadBadgeColor);
};
export const useMessageIgnored = (): boolean => {
	const { store, isIgnored } = useMessageCtx();
	const manualUnignored = useStore(store, s => s.manualUnignored);
	return manualUnignored ? false : isIgnored;
};
export const useRevealIgnored = (): (() => void) => {
	const { revealIgnored } = useMessageCtx();
	return revealIgnored;
};

export const useMessageLongPress = (): (() => void) => {
	const { item, store } = useMessageCtx();
	const isInfo = useIsInfo();
	const { hasError } = useMessageStatus();
	const isEncrypted = useIsEncrypted();
	const archived = useArchived();
	const onLongPress = useStore(store, s => s.onLongPress);
	return () => {
		if (isInfo || hasError || isEncrypted || archived) {
			return;
		}
		onLongPress?.(item);
	};
};

export const useOnLinkPress = (): ((link: string) => void) => {
	const { item } = useMessageCtx();
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
	const { item, store } = useMessageCtx();
	const isThreadRoom = useIsThreadRoom();
	const onPress = useStore(store, s => s.onPress);
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
