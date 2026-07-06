import { render } from '@testing-library/react-native';

import {
	createInteractionStore,
	InteractionProvider,
	type TInteraction,
	useIsBeingEdited,
	useMessageAction,
	useSelectedMessages
} from './InteractionStore';

describe('InteractionStore', () => {
	describe('useIsBeingEdited', () => {
		it('returns false with no provider (module fallback store) and does not throw', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useIsBeingEdited('msg-1'));
				return null;
			};

			expect(() => render(<Probe />)).not.toThrow();
			expect(spy).toHaveBeenLastCalledWith(false);
		});

		it('returns true only for the message being edited under a provider', () => {
			const editedSpy = jest.fn();
			const otherSpy = jest.fn();
			const Probe = () => {
				editedSpy(useIsBeingEdited('msg-1'));
				otherSpy(useIsBeingEdited('msg-2'));
				return null;
			};

			render(
				<InteractionProvider initialState={{ kind: 'edit', messageId: 'msg-1' }}>
					<Probe />
				</InteractionProvider>
			);

			expect(editedSpy).toHaveBeenLastCalledWith(true);
			expect(otherSpy).toHaveBeenLastCalledWith(false);
		});
	});

	describe('action hooks without a provider', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('useMessageAction throws', () => {
			const Probe = () => {
				useMessageAction();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Interaction hooks must be used within an InteractionProvider');
		});

		it('useSelectedMessages throws', () => {
			const Probe = () => {
				useSelectedMessages();
				return null;
			};
			expect(() => render(<Probe />)).toThrow('Interaction hooks must be used within an InteractionProvider');
		});
	});

	describe('action creators (union transitions)', () => {
		it('setEditing sets an edit interaction with the given messageId', () => {
			const store = createInteractionStore();
			store.getState().actions.setEditing('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('initQuote starts a quote interaction with a single messageId', () => {
			const store = createInteractionStore();
			store.getState().actions.initQuote('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('appendQuote appends to an existing quote interaction', () => {
			const store = createInteractionStore();
			store.getState().actions.initQuote('msg-1');
			store.getState().actions.appendQuote('msg-2');
			expect(store.getState().interaction).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
		});

		it('appendQuote starts a new quote interaction when there is none', () => {
			const store = createInteractionStore();
			store.getState().actions.appendQuote('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('removeQuote drops a messageId and keeps the quote interaction if others remain', () => {
			const store = createInteractionStore({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'quote', messageIds: ['msg-2'] });
		});

		it('removeQuote clears the interaction when the last quoted message is removed', () => {
			const store = createInteractionStore({ kind: 'quote', messageIds: ['msg-1'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().interaction).toBeNull();
		});

		it('removeQuote is a no-op when the current interaction is not a quote', () => {
			const store = createInteractionStore({ kind: 'edit', messageId: 'msg-1' });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('setReacting sets a react interaction with the given messageId', () => {
			const store = createInteractionStore();
			store.getState().actions.setReacting('msg-1');
			expect(store.getState().interaction).toEqual({ kind: 'react', messageId: 'msg-1' });
		});

		it('setQuotes sets a quote interaction with the given ids, or clears it when empty', () => {
			const store = createInteractionStore();
			store.getState().actions.setQuotes(['msg-1', 'msg-2']);
			expect(store.getState().interaction).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });

			store.getState().actions.setQuotes([]);
			expect(store.getState().interaction).toBeNull();
		});

		it('reset clears any interaction', () => {
			const store = createInteractionStore({ kind: 'react', messageId: 'msg-1' });
			store.getState().actions.reset();
			expect(store.getState().interaction).toBeNull();
		});

		it('does not allow representing invalid combinations at the type level', () => {
			// @ts-expect-error edit requires a single messageId, not messageIds
			const invalidEdit: TInteraction = { kind: 'edit', messageIds: ['msg-1'] };
			// @ts-expect-error quote requires messageIds, not messageId
			const invalidQuote: TInteraction = { kind: 'quote', messageId: 'msg-1' };
			expect(invalidEdit).toBeDefined();
			expect(invalidQuote).toBeDefined();
		});
	});
});
