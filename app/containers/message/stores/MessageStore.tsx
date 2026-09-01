import { createContext, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
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
	useOnThreadPress,
	useOnDiscussionPress
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
// Guarded by app/lib/database/model/__tests__/Message.memo.test.ts.
const isRecordOrArray = (value: unknown): value is Record<string, unknown> | unknown[] =>
	typeof value === 'object' && value !== null;

const shallowEqual = (a: Record<string, unknown> | unknown[], b: Record<string, unknown> | unknown[]): boolean => {
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every(key => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
};

const useMessageFieldProd = <T,>(selector: (item: TAnyMessageModel) => T): T => useMessageStore(s => selector(s.item));

// Detects a selector that returns a fresh object/array every call (e.g. an inline `i => ({ a: i.a })`):
// on an unchanged tick, a memoized field selector keeps returning the same reference (Object.is bail
// holds), while a naive selector produces a new-but-shallow-equal value every time. Warns once.
const useMessageFieldDev = <T,>(selector: (item: TAnyMessageModel) => T): T => {
	const prevRef = useRef<{ tick: number; result: T } | undefined>(undefined);
	const warnedRef = useRef(false);
	return useMessageStore(s => {
		const result = selector(s.item);
		const prev = prevRef.current;
		if (
			!warnedRef.current &&
			prev &&
			prev.tick === s.tick &&
			!Object.is(prev.result, result) &&
			isRecordOrArray(prev.result) &&
			isRecordOrArray(result) &&
			shallowEqual(prev.result, result)
		) {
			warnedRef.current = true;
			console.warn(
				'[MessageStore] useMessageField selector returned a new reference for unchanged data. ' +
					'Use a useShallow domain hook instead of an inline object/array selector.'
			);
		}
		prevRef.current = { tick: s.tick, result };
		return result;
	});
};

export const useMessageField: <T>(selector: (item: TAnyMessageModel) => T) => T = __DEV__
	? useMessageFieldDev
	: useMessageFieldProd;

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
	const [store] = useState(() =>
		createMessageStore({ item, previousItem, isIgnored: isIgnored ?? false, onPress, onLongPress, threadBadgeColor })
	);

	// Push item/previousItem into the store and (re)subscribe both records to the same tick.
	// Resubscribing on either change is a single sync commit, so there's no observable churn.
	useEffect(() => {
		store.setState({ item, previousItem });
		const unsubscribeItem = subscribeModel(item, store);
		const unsubscribePrevious = previousItem ? subscribeModel(previousItem, store) : undefined;
		return () => {
			unsubscribeItem?.();
			unsubscribePrevious?.();
		};
	}, [item, previousItem, store]);

	// Mirror per-message row handlers so field-level selectors subscribe without churning the context value.
	useEffect(() => {
		store.setState({ onPress, onLongPress, threadBadgeColor });
	}, [onPress, onLongPress, threadBadgeColor, store]);

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

export const useIsOwnMessage = (): boolean => {
	const author = useMessageStore(s => s.item.u);
	const user = useMessageUser();
	return author?._id === user?.id;
};

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

const canAutoTranslateMessage = (
	item: TAnyMessageModel,
	username: string | undefined,
	autoTranslateRoom: boolean | undefined,
	autoTranslateLanguage: string | undefined
): boolean => !!(autoTranslateRoom && autoTranslateLanguage && item.autoTranslate && item.u?.username !== username);

export const useTranslateLanguage = (): string | undefined => {
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	const user = useMessageUser();
	return useMessageStore(s =>
		canAutoTranslateMessage(s.item, user?.username, autoTranslateRoom, autoTranslateLanguage) ? autoTranslateLanguage : undefined
	);
};

export const useMessageText = (): { messageText: TAnyMessageModel['msg']; isTranslated: boolean } => {
	const user = useMessageUser();
	const { autoTranslateRoom, autoTranslateLanguage } = useAutoTranslate();
	return useMessageStore(
		useShallow(s => {
			let messageText = s.item.msg;
			let isTranslated = false;
			if (canAutoTranslateMessage(s.item, user?.username, autoTranslateRoom, autoTranslateLanguage)) {
				const translated = getMessageTranslation(s.item, autoTranslateLanguage as string);
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

// Single source of truth for pressability, shared by the Touch gate, long-press guard and
// press guard. longPressable drops encrypted messages (tap can still open a thread; the action
// sheet is suppressed); revealsIgnored is tappable ∧ isIgnored (a tap reveals instead of pressing).
export const useMessageTouchable = (): { tappable: boolean; longPressable: boolean; revealsIgnored: boolean } => {
	const isInfo = useIsInfoMessage();
	const { hasError, isTemp } = useMessageStatus();
	const isEncrypted = useIsEncrypted();
	const archived = useIsArchived();
	const isIgnored = useMessageIgnored();
	const type = useMessageField(item => item.t);

	const tappable = !(isInfo || hasError || archived || isTemp || type === 'jitsi_call_started');
	const longPressable = tappable && !isEncrypted;
	const revealsIgnored = tappable && isIgnored;

	return { tappable, longPressable, revealsIgnored };
};

export const useMessageLongPress = (): (() => void) => {
	const item = useMessageItem();
	const { longPressable } = useMessageTouchable();
	const onLongPress = useMessageStore(s => s.onLongPress);
	return () => {
		if (!longPressable) {
			return;
		}
		onLongPress?.(item);
	};
};

export const useOnLinkPress = (): ((link: string) => void) => {
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
	const item = useMessageItem();
	const isThreadRoom = useIsThreadRoom();
	const onPress = useMessageStore(s => s.onPress);
	const onThreadPress = useOnThreadPress();
	const onDiscussionPress = useOnDiscussionPress();
	const closeEmojiAndAction = useCloseEmojiAndAction();
	const { revealsIgnored } = useMessageTouchable();
	const revealIgnored = useRevealIgnored();

	const handlePress = useDebounce(
		() => {
			if (revealsIgnored) {
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
				onDiscussionPress(item.drid);
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
