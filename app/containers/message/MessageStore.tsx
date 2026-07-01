import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type TAnyMessageModel } from '../../definitions';
import MessageContext from './Context';
import { getMessageTranslation } from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/constants/keys';
import { messagesStatus } from '../../lib/constants/messagesStatus';

const createMessageStore = () => createStore(() => ({ tick: 0 }));

type MessageStore = ReturnType<typeof createMessageStore>;

type MessageCtxValue = { store: MessageStore; item: TAnyMessageModel; previousItem?: TAnyMessageModel };

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
	// @ts-ignore: experimentalSubscribe is not yet in WatermelonDB's TS types
	if (typeof m.experimentalSubscribe !== 'function') return undefined;
	// @ts-ignore: experimentalSubscribe is not yet in WatermelonDB's TS types
	return m.experimentalSubscribe(() => store.setState(s => ({ tick: s.tick + 1 })));
};

export const MessageProvider = ({
	item,
	previousItem,
	children
}: {
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	children: ReactNode;
}): ReactElement => {
	'use memo';

	const [store] = useState(createMessageStore);

	// Header grouping and thread position depend on the previous record too, so each effect
	// subscribes one record; both feed the same tick. Keeping them separate means changing
	// previousItem does not tear down and recreate item's subscription.
	useEffect(() => subscribeModel(item, store), [item, store]);
	useEffect(() => (previousItem ? subscribeModel(previousItem, store) : undefined), [previousItem, store]);

	return <MessageStoreContext.Provider value={{ store, item, previousItem }}>{children}</MessageStoreContext.Provider>;
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

export const useMessageMeta = (): Pick<TAnyMessageModel, 'ts' | 'unread' | 'pinned' | 't'> => {
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
			// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
			prev.ts.toDateString() === item.ts.toDateString() &&
			prev.u?.username === item.u?.username &&
			!(prev.groupable === false || item.groupable === false || broadcast === true) &&
			// @ts-ignore TODO: IMessage vs IMessageFromServer non-sense
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
	const { broadcast, Message_GroupingPeriod } = useContext(MessageContext);
	return useStore(store, () =>
		computeIsHeader(previousItem, item, !!broadcast, Message_GroupingPeriod, item.status === messagesStatus.ERROR)
	);
};

export const useThreadPosition = (): { isThreadReply: boolean; isThreadSequential: boolean } => {
	const { store, item, previousItem } = useMessageCtx();
	const { isThreadRoom } = useContext(MessageContext);
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

export const useMessageText = (): { messageText: TAnyMessageModel['msg']; isTranslated: boolean } => {
	const { store, item } = useMessageCtx();
	const { user, autoTranslateRoom, autoTranslateLanguage } = useContext(MessageContext);
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
