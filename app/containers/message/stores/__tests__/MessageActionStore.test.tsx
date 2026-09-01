import { render } from '@testing-library/react-native';

import {
	createMessageActionStore,
	inertStore,
	MessageActionProvider,
	useIsBeingEdited,
	useMessageAction
} from '../MessageActionStore';

describe('MessageActionStore', () => {
	describe('useIsBeingEdited', () => {
		it('returns false with no provider (inert store) and does not throw', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useIsBeingEdited('msg-1'));
				return null;
			};

			expect(() => render(<Probe />)).not.toThrow();
			expect(spy).toHaveBeenLastCalledWith(false);
		});

		it('does not share mutable state across separate no-provider renders, and its actions throw', () => {
			const spyA = jest.fn();
			const spyB = jest.fn();
			const ProbeA = () => {
				spyA(useIsBeingEdited('msg-1'));
				return null;
			};
			const ProbeB = () => {
				spyB(useIsBeingEdited('msg-1'));
				return null;
			};

			render(<ProbeA />);
			render(<ProbeB />);

			expect(spyA).toHaveBeenLastCalledWith(false);
			expect(spyB).toHaveBeenLastCalledWith(false);
			expect(() => inertStore.getState().actions.startEditing('x')).toThrow(
				'MessageActionStore: no provider — actions unavailable'
			);
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
				<MessageActionProvider initialAction={{ kind: 'edit', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(editedSpy).toHaveBeenLastCalledWith(true);
			expect(otherSpy).toHaveBeenLastCalledWith(false);
		});

		it('returns false for a quote action, even for a matching messageId', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useIsBeingEdited('msg-1'));
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['msg-1'] }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith(false);
		});

		it('returns false for a react action, even for a matching messageId', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useIsBeingEdited('msg-1'));
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'react', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith(false);
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
			expect(() => render(<Probe />)).toThrow('Message action hooks must be used within a MessageActionProvider');
		});
	});

	describe('useMessageAction under a provider', () => {
		it('returns null when there is no action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageAction());
				return null;
			};

			render(
				<MessageActionProvider>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith(null);
		});

		it('returns the edit action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageAction());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'edit', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith({ kind: 'edit', messageId: 'msg-1' });
		});

		it('returns the quote action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageAction());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['msg-1', 'msg-2'] }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
		});

		it('returns the react action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useMessageAction());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'react', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith({ kind: 'react', messageId: 'msg-1' });
		});
	});

	describe('action creators (union transitions)', () => {
		it('startEditing sets an edit action with the given messageId', () => {
			const store = createMessageActionStore();
			store.getState().actions.startEditing('msg-1');
			expect(store.getState().action).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('startQuote starts a quote action with a single messageId', () => {
			const store = createMessageActionStore();
			store.getState().actions.startQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('addQuote appends to an existing quote action', () => {
			const store = createMessageActionStore();
			store.getState().actions.startQuote('msg-1');
			store.getState().actions.addQuote('msg-2');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
		});

		it('addQuote starts a new quote action when there is none', () => {
			const store = createMessageActionStore();
			store.getState().actions.addQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('addQuote does not append a duplicate messageId', () => {
			const store = createMessageActionStore();
			store.getState().actions.startQuote('msg-1');
			store.getState().actions.addQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('removeQuote drops a messageId and keeps the quote action if others remain', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-2'] });
		});

		it('removeQuote clears the action when the last quoted message is removed', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toBeNull();
		});

		it('removeQuote is a no-op when the current action is not a quote', () => {
			const store = createMessageActionStore({ kind: 'edit', messageId: 'msg-1' });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('startReacting sets a react action with the given messageId', () => {
			const store = createMessageActionStore();
			store.getState().actions.startReacting('msg-1');
			expect(store.getState().action).toEqual({ kind: 'react', messageId: 'msg-1' });
		});

		it('setQuoteMessageIds sets a quote action with the given ids, or clears it when empty', () => {
			const store = createMessageActionStore();
			store.getState().actions.setQuoteMessageIds(['msg-1', 'msg-2']);
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });

			store.getState().actions.setQuoteMessageIds([]);
			expect(store.getState().action).toBeNull();
		});

		it('clear resets a react action', () => {
			const store = createMessageActionStore({ kind: 'react', messageId: 'msg-1' });
			store.getState().actions.clear();
			expect(store.getState().action).toBeNull();
		});

		it('clear resets an edit action', () => {
			const store = createMessageActionStore({ kind: 'edit', messageId: 'msg-1' });
			store.getState().actions.clear();
			expect(store.getState().action).toBeNull();
		});

		it('clear resets a quote action', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
			store.getState().actions.clear();
			expect(store.getState().action).toBeNull();
		});
	});
});
