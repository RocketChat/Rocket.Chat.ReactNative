import { render } from '@testing-library/react-native';

import {
	createMessageActionStore,
	MessageActionProvider,
	useEditingMessageId,
	useIsBeingEdited,
	useMessageAction,
	useQuotedMessageIds
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

		it('does not share mutable state across separate no-provider renders', () => {
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

	describe('useQuotedMessageIds', () => {
		it('returns the quoted messageIds under a quote action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useQuotedMessageIds());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['msg-1', 'msg-2'] }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith(['msg-1', 'msg-2']);
		});

		it('returns an empty array for non-quote actions', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useQuotedMessageIds());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'edit', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith([]);
		});
	});

	describe('useEditingMessageId', () => {
		it('returns the messageId under an edit action', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useEditingMessageId());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'edit', messageId: 'msg-1' }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith('msg-1');
		});

		it('returns undefined for non-edit actions', () => {
			const spy = jest.fn();
			const Probe = () => {
				spy(useEditingMessageId());
				return null;
			};

			render(
				<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['msg-1'] }}>
					<Probe />
				</MessageActionProvider>
			);

			expect(spy).toHaveBeenLastCalledWith(undefined);
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

	describe('requestEditing', () => {
		it('admits and sets an edit action when idle', () => {
			const store = createMessageActionStore();
			store.getState().actions.requestEditing('msg-1');
			expect(store.getState().action).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('rejects when an action is already in progress', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['other-msg'] });
			store.getState().actions.requestEditing('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['other-msg'] });
		});
	});

	describe('requestQuote', () => {
		it('admits and starts a quote action with a single messageId when idle', () => {
			const store = createMessageActionStore();
			store.getState().actions.requestQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('admits and appends to an existing quote action', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1'] });
			store.getState().actions.requestQuote('msg-2');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
		});

		it('rejects a duplicate messageId', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1'] });
			store.getState().actions.requestQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('rejects when a non-quote action is already in progress', () => {
			const store = createMessageActionStore({ kind: 'edit', messageId: 'other-msg' });
			store.getState().actions.requestQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'edit', messageId: 'other-msg' });
		});
	});

	describe('removeQuote', () => {
		it('drops a messageId and keeps the quote action if others remain', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-2'] });
		});

		it('clears the action when the last quoted message is removed', () => {
			const store = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1'] });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toBeNull();
		});

		it('is a no-op when the current action is not a quote', () => {
			const store = createMessageActionStore({ kind: 'edit', messageId: 'msg-1' });
			store.getState().actions.removeQuote('msg-1');
			expect(store.getState().action).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});
	});

	describe('startReacting', () => {
		it('sets a react action with the given messageId', () => {
			const store = createMessageActionStore();
			store.getState().actions.startReacting('msg-1');
			expect(store.getState().action).toEqual({ kind: 'react', messageId: 'msg-1' });
		});
	});

	describe('setQuoteMessageIds and clear', () => {
		it('setQuoteMessageIds sets a quote action with the given ids, or clears it when empty', () => {
			const store = createMessageActionStore();
			store.getState().actions.setQuoteMessageIds(['msg-1', 'msg-2']);
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });

			store.getState().actions.setQuoteMessageIds([]);
			expect(store.getState().action).toBeNull();
		});

		it('setQuoteMessageIds overrides an in-progress non-quote action unconditionally', () => {
			const store = createMessageActionStore({ kind: 'edit', messageId: 'msg-1' });
			store.getState().actions.setQuoteMessageIds(['msg-2']);
			expect(store.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-2'] });
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
