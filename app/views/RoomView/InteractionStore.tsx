import { createContext, type ReactElement, useContext, useState } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type TMessageAction } from './context';

export type TInteraction =
	| { kind: 'edit'; messageId: string }
	| { kind: 'quote'; messageIds: string[] }
	| { kind: 'react'; messageId: string }
	| null;

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
	interaction: TInteraction;
	// Built once inside the store initializer — stable ref for consumers.
	actions: TInteractionActions;
};

export const createInteractionStore = (initialInteraction?: TInteraction) =>
	createStore<InteractionState>()(set => ({
		interaction: initialInteraction ?? null,
		actions: {
			setEditing: messageId => set({ interaction: { kind: 'edit', messageId } }),
			initQuote: messageId => set({ interaction: { kind: 'quote', messageIds: [messageId] } }),
			appendQuote: messageId =>
				set(state =>
					state.interaction?.kind === 'quote'
						? { interaction: { kind: 'quote', messageIds: [...state.interaction.messageIds, messageId] } }
						: { interaction: { kind: 'quote', messageIds: [messageId] } }
				),
			removeQuote: messageId =>
				set(state => {
					if (state.interaction?.kind !== 'quote') {
						return {};
					}
					const messageIds = state.interaction.messageIds.filter(m => m !== messageId);
					return { interaction: messageIds.length ? { kind: 'quote', messageIds } : null };
				}),
			setReacting: messageId => set({ interaction: { kind: 'react', messageId } }),
			setQuotes: messageIds => set({ interaction: messageIds.length ? { kind: 'quote', messageIds } : null }),
			reset: () => set({ interaction: null })
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

export const useMessageAction = (): TMessageAction => useInteractionStore(s => s.interaction?.kind ?? null);

export const useSelectedMessages = (): string[] =>
	useInteractionStore(
		useShallow(s => {
			const { interaction } = s;
			if (!interaction) {
				return [];
			}
			return interaction.kind === 'quote' ? interaction.messageIds : [interaction.messageId];
		})
	);

export const useIsBeingEdited = (messageId: string): boolean => {
	const store = useContext(InteractionStoreContext) ?? fallbackStore;
	return useStore(store, s => s.interaction?.kind === 'edit' && s.interaction.messageId === messageId);
};

export const InteractionProvider = ({
	initialState,
	children
}: {
	initialState?: TInteraction;
	children: ReactElement;
}): ReactElement => {
	'use memo';

	const [store] = useState(() => createInteractionStore(initialState));
	return <InteractionStoreContext.Provider value={store}>{children}</InteractionStoreContext.Provider>;
};
