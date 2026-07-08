import { createContext, type ReactNode, useContext, useState } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type TMessageActionState =
	| { kind: 'edit'; messageId: string }
	| { kind: 'quote'; messageIds: string[] }
	| { kind: 'react'; messageId: string }
	| null;

type TMessageActionActions = {
	startEditing(messageId: string): void;
	startQuote(messageId: string): void;
	addQuote(messageId: string): void;
	removeQuote(messageId: string): void;
	startReacting(messageId: string): void;
	setQuoteMessageIds(messageIds: string[]): void;
	clear(): void;
};

type MessageActionState = {
	action: TMessageActionState;
	// Built once inside the store initializer — stable ref for consumers.
	actions: TMessageActionActions;
};

export const createMessageActionStore = (initialAction?: TMessageActionState) =>
	createStore<MessageActionState>()(set => ({
		action: initialAction ?? null,
		actions: {
			startEditing: messageId => set({ action: { kind: 'edit', messageId } }),
			startQuote: messageId => set({ action: { kind: 'quote', messageIds: [messageId] } }),
			addQuote: messageId =>
				set(state => {
					if (state.action?.kind !== 'quote') {
						return { action: { kind: 'quote', messageIds: [messageId] } };
					}
					if (state.action.messageIds.includes(messageId)) {
						return {};
					}
					return { action: { kind: 'quote', messageIds: [...state.action.messageIds, messageId] } };
				}),
			removeQuote: messageId =>
				set(state => {
					if (state.action?.kind !== 'quote') {
						return {};
					}
					const messageIds = state.action.messageIds.filter(m => m !== messageId);
					return { action: messageIds.length ? { kind: 'quote', messageIds } : null };
				}),
			startReacting: messageId => set({ action: { kind: 'react', messageId } }),
			setQuoteMessageIds: messageIds => set({ action: messageIds.length ? { kind: 'quote', messageIds } : null }),
			clear: () => set({ action: null })
		}
	}));

export type TMessageActionStore = ReturnType<typeof createMessageActionStore>;

export const MessageActionStoreContext = createContext<TMessageActionStore | null>(null);

// Rows rendered outside a RoomView (search, pinned) can never be in edit mode.
// Using a module-level fallback avoids a conditional hook call in useIsBeingEdited.
const fallbackStore = createMessageActionStore();

const useMessageActionStore = <T,>(selector: (state: MessageActionState) => T): T => {
	const store = useContext(MessageActionStoreContext);
	if (!store) {
		throw new Error('Interaction hooks must be used within a MessageActionProvider');
	}
	return useStore(store, selector);
};

export const useMessageAction = (): NonNullable<TMessageActionState>['kind'] | null =>
	useMessageActionStore(s => s.action?.kind ?? null);

export const useSelectedMessages = (): string[] =>
	useMessageActionStore(
		useShallow(s => {
			const { action } = s;
			if (!action) {
				return [];
			}
			return action.kind === 'quote' ? action.messageIds : [action.messageId];
		})
	);

export const useIsBeingEdited = (messageId: string): boolean => {
	const store = useContext(MessageActionStoreContext) ?? fallbackStore;
	return useStore(store, s => s.action?.kind === 'edit' && s.action.messageId === messageId);
};

export const MessageActionProvider = ({
	initialAction,
	children
}: {
	initialAction?: TMessageActionState;
	children: ReactNode;
}): ReactNode => {
	'use memo';

	const [store] = useState(() => createMessageActionStore(initialAction));
	return <MessageActionStoreContext.Provider value={store}>{children}</MessageActionStoreContext.Provider>;
};
