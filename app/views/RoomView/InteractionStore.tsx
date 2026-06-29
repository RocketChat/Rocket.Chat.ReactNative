import { createContext, type ReactElement, useContext, useState } from 'react';
import { createStore, useStore } from 'zustand';

import { type TMessageAction } from './context';

type TInteractionActions = {
	setEditing(messageId: string): void;
	initQuote(messageId: string): void;
	appendQuote(messageId: string): void;
	removeQuote(messageId: string): void;
	setReacting(messageId: string): void;
	setQuotes(messageIds: string[]): void;
	reset(): void;
};

type InteractionState = {
	action: TMessageAction;
	selectedMessages: string[];
	// Built once inside the store initializer — stable ref for consumers.
	actions: TInteractionActions;
};

export const createInteractionStore = (initialState?: { action?: TMessageAction; selectedMessages?: string[] }) =>
	createStore<InteractionState>()(set => ({
		action: initialState?.action ?? null,
		selectedMessages: initialState?.selectedMessages ?? [],
		actions: {
			setEditing: messageId => set({ action: 'edit', selectedMessages: [messageId] }),
			initQuote: messageId => set({ action: 'quote', selectedMessages: [messageId] }),
			appendQuote: messageId => set(state => ({ selectedMessages: [...state.selectedMessages, messageId] })),
			removeQuote: messageId =>
				set(state => {
					const msgs = state.selectedMessages.filter(m => m !== messageId);
					return { selectedMessages: msgs, action: msgs.length ? 'quote' : null };
				}),
			setReacting: messageId => set({ action: 'react', selectedMessages: [messageId] }),
			setQuotes: messageIds => set({ action: messageIds.length ? 'quote' : null, selectedMessages: messageIds }),
			reset: () => set({ action: null, selectedMessages: [] })
		}
	}));

export type InteractionStore = ReturnType<typeof createInteractionStore>;

export const InteractionStoreContext = createContext<InteractionStore | null>(null);

// Rows rendered outside a RoomView (search, pinned) can never be in edit mode.
// Using a module-level fallback avoids a conditional hook call in useIsBeingEdited.
const fallbackStore = createInteractionStore();

const useInteractionStore = <T,>(selector: (state: InteractionState) => T): T => {
	const store = useContext(InteractionStoreContext);
	if (!store) {
		throw new Error('Interaction hooks must be used within an InteractionProvider');
	}
	return useStore(store, selector);
};

export const useMessageAction = (): TMessageAction => useInteractionStore(s => s.action);
export const useSelectedMessages = (): string[] => useInteractionStore(s => s.selectedMessages);

export const useIsBeingEdited = (messageId: string): boolean => {
	const store = useContext(InteractionStoreContext) ?? fallbackStore;
	return useStore(store, s => s.action === 'edit' && s.selectedMessages[0] === messageId);
};

export const useInteractionApi = (): TInteractionActions => useInteractionStore(s => s.actions);

export const InteractionProvider = ({
	initialState,
	children
}: {
	initialState?: { action?: TMessageAction; selectedMessages?: string[] };
	children: ReactElement;
}): ReactElement => {
	'use memo';

	const [store] = useState(() => createInteractionStore(initialState));
	return <InteractionStoreContext.Provider value={store}>{children}</InteractionStoreContext.Provider>;
};
