import { act, renderHook } from '@testing-library/react-native';

import { editMessage } from '../../../../lib/methods/editMessage';
import { setReaction } from '../../../../lib/services/restApi';
import log from '../../../../lib/methods/helpers/log';
import { Review } from '../../../../lib/methods/helpers/review';
import { getMessageById } from '../../../../lib/database/services/Message';
import { createMessageActionStore } from '../../../../containers/message/stores/MessageActionStore';
import ReactionPicker from '../../components/ReactionPicker';
import { useMessageActions } from '../useMessageActions';
import { type IUseMessageActionsParams } from '../useMessageActions';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('../../../../lib/services/restApi', () => ({
	setReaction: jest.fn()
}));
jest.mock('../../../../lib/methods/editMessage', () => ({
	editMessage: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../../lib/methods/helpers/review', () => ({
	Review: { pushPositiveEvent: jest.fn() }
}));
jest.mock('../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

const mockEditMessage = editMessage as jest.Mock;
const mockSetReaction = setReaction as jest.Mock;
const mockLog = log as jest.Mock;
const mockGetMessageById = getMessageById as jest.Mock;

const RID = 'rid-1';

const createRefs = () => ({
	messageComposerRef: {
		current: {
			closeEmojiKeyboardAndAction: jest.fn((action?: Function, params?: any) => action?.(params))
		}
	},
	messageActionsRef: {
		current: { showMessageActions: jest.fn() }
	},
	messageErrorActionsRef: {
		current: { showMessageErrorActions: jest.fn() }
	}
});

const renderMessageActions = (overrides: Partial<IUseMessageActionsParams> = {}, refs = createRefs()) => {
	const messageActionStore = overrides.messageActionStore ?? createMessageActionStore();
	const showActionSheet = jest.fn();
	const hideActionSheet = jest.fn();
	const onThreadPress = jest.fn();

	const { result } = renderHook(() =>
		useMessageActions({
			messageActionStore,
			showActionSheet,
			hideActionSheet,
			rid: RID,
			tmid: undefined,
			onThreadPress,
			messageComposerRef: refs.messageComposerRef as any,
			messageActionsRef: refs.messageActionsRef as any,
			messageErrorActionsRef: refs.messageErrorActionsRef as any,
			...overrides
		})
	);

	return { result, messageActionStore, showActionSheet, hideActionSheet, navigation: mockNavigation, onThreadPress, refs };
};

describe('useMessageActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('edit', () => {
		it('onEditInit starts editing when no action is in progress', () => {
			const { result, messageActionStore } = renderMessageActions();

			act(() => result.current.onEditInit('msg-1'));

			expect(messageActionStore.getState().action).toEqual({ kind: 'edit', messageId: 'msg-1' });
		});

		it('onEditInit no-ops when an action is already in progress', () => {
			const { result, messageActionStore } = renderMessageActions();
			messageActionStore.getState().actions.startQuote('other-msg');

			act(() => result.current.onEditInit('msg-1'));

			expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['other-msg'] });
		});

		it('onEditCancel clears the current action', () => {
			const { result, messageActionStore } = renderMessageActions();
			messageActionStore.getState().actions.startEditing('msg-1');

			act(() => result.current.onEditCancel());

			expect(messageActionStore.getState().action).toBeNull();
		});

		it('onEditRequest clears the action then calls editMessage', async () => {
			mockEditMessage.mockResolvedValue(undefined);
			const { result, messageActionStore } = renderMessageActions();
			messageActionStore.getState().actions.startEditing('msg-1');

			await act(async () => {
				await result.current.onEditRequest({ id: 'msg-1', msg: 'edited', rid: RID });
			});

			expect(messageActionStore.getState().action).toBeNull();
			expect(mockEditMessage).toHaveBeenCalledWith({ id: 'msg-1', msg: 'edited', rid: RID });
		});

		it('onEditRequest logs the error when editMessage rejects', async () => {
			const error = new Error('boom');
			mockEditMessage.mockRejectedValue(error);
			const { result } = renderMessageActions();

			await act(async () => {
				await result.current.onEditRequest({ id: 'msg-1', msg: 'edited', rid: RID });
			});

			expect(mockLog).toHaveBeenCalledWith(error);
		});
	});

	describe('quote', () => {
		it('onQuoteInit starts a quote when idle', () => {
			const { result, messageActionStore } = renderMessageActions();

			act(() => result.current.onQuoteInit('msg-1'));

			expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1'] });
		});

		it('onQuoteInit appends to an in-progress quote', () => {
			const { result, messageActionStore } = renderMessageActions();
			messageActionStore.getState().actions.startQuote('msg-1');

			act(() => result.current.onQuoteInit('msg-2'));

			expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });
		});

		it('onRemoveQuoteMessage removes a quoted message id', () => {
			const { result, messageActionStore } = renderMessageActions();
			messageActionStore.getState().actions.startQuote('msg-1');
			messageActionStore.getState().actions.addQuote('msg-2');

			act(() => result.current.onRemoveQuoteMessage('msg-1'));

			expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-2'] });
		});
	});

	describe('reactions', () => {
		it('onReactionPress sets the reaction, closes the action and reports a positive review event', async () => {
			mockSetReaction.mockResolvedValue(undefined);
			const { result, messageActionStore, hideActionSheet } = renderMessageActions();
			messageActionStore.getState().actions.startReacting('msg-1');

			await act(async () => {
				await result.current.onReactionPress('smile', 'msg-1');
			});

			expect(mockSetReaction).toHaveBeenCalledWith('smile', 'msg-1');
			expect(hideActionSheet).toHaveBeenCalledTimes(1);
			expect(messageActionStore.getState().action).toBeNull();
			expect(Review.pushPositiveEvent).toHaveBeenCalledTimes(1);
		});

		it('onReactionPress resolves the shortname from an emoji object', async () => {
			mockSetReaction.mockResolvedValue(undefined);
			const { result } = renderMessageActions();

			await act(async () => {
				await result.current.onReactionPress({ name: 'grin' } as any, 'msg-1');
			});

			expect(mockSetReaction).toHaveBeenCalledWith('grin', 'msg-1');
		});

		it('onReactionPress logs the error when setReaction rejects', async () => {
			const error = new Error('boom');
			mockSetReaction.mockRejectedValue(error);
			const { result, hideActionSheet } = renderMessageActions();

			await act(async () => {
				await result.current.onReactionPress('smile', 'msg-1');
			});

			expect(mockLog).toHaveBeenCalledWith(error);
			expect(hideActionSheet).not.toHaveBeenCalled();
			expect(Review.pushPositiveEvent).not.toHaveBeenCalled();
		});

		it('onReactionInit no-ops when an action is already in progress', () => {
			const { result, messageActionStore, showActionSheet } = renderMessageActions();
			messageActionStore.getState().actions.startQuote('other-msg');

			act(() => result.current.onReactionInit('msg-1'));

			expect(showActionSheet).not.toHaveBeenCalled();
		});

		it('onReactionInit starts reacting and shows the reaction picker', () => {
			jest.useFakeTimers();
			const { result, messageActionStore, showActionSheet } = renderMessageActions();

			act(() => result.current.onReactionInit('msg-1'));
			expect(messageActionStore.getState().action).toEqual({ kind: 'react', messageId: 'msg-1' });

			act(() => {
				jest.advanceTimersByTime(300);
			});

			expect(showActionSheet).toHaveBeenCalledTimes(1);
			const options = showActionSheet.mock.calls[0][0];
			expect(options.children.type).toBe(ReactionPicker);
			expect(options.children.props.messageId).toBe('msg-1');
			jest.useRealTimers();
		});
	});

	describe('onMessageLongPress', () => {
		it('shows message actions for a normal main-room message', () => {
			const { result, refs } = renderMessageActions();
			const message = { id: 'msg-1' } as any;

			act(() => result.current.onMessageLongPress(message));

			expect(refs.messageActionsRef.current.showMessageActions).toHaveBeenCalledWith(message);
		});

		it('no-ops when an action other than quote is already in progress', () => {
			const { result, messageActionStore, refs } = renderMessageActions();
			messageActionStore.getState().actions.startEditing('other-msg');
			const message = { id: 'msg-1' } as any;

			act(() => result.current.onMessageLongPress(message));

			expect(refs.messageActionsRef.current.showMessageActions).not.toHaveBeenCalled();
		});

		it('allows a long-press while quoting (kind === quote)', () => {
			const { result, messageActionStore, refs } = renderMessageActions();
			messageActionStore.getState().actions.startQuote('other-msg');
			const message = { id: 'msg-1' } as any;

			act(() => result.current.onMessageLongPress(message));

			expect(refs.messageActionsRef.current.showMessageActions).toHaveBeenCalledWith(message);
		});

		it('no-ops for a thread message viewed from the main room (no tmid)', () => {
			const { result, refs } = renderMessageActions({ tmid: undefined });
			const message = { id: 'msg-1', tmid: 'thread-1' } as any;

			act(() => result.current.onMessageLongPress(message));

			expect(refs.messageActionsRef.current.showMessageActions).not.toHaveBeenCalled();
		});

		it('allows long-press on a thread message when already inside that thread', () => {
			const { result, refs } = renderMessageActions({ tmid: 'thread-1' });
			const message = { id: 'msg-1', tmid: 'thread-1' } as any;

			act(() => result.current.onMessageLongPress(message));

			expect(refs.messageActionsRef.current.showMessageActions).toHaveBeenCalledWith(message);
		});
	});

	describe('error actions', () => {
		it('errorActionsShow forwards the message to the error actions ref', () => {
			const { result, refs } = renderMessageActions();
			const message = { id: 'msg-1' } as any;

			act(() => result.current.errorActionsShow(message));

			expect(refs.messageErrorActionsRef.current.showMessageErrorActions).toHaveBeenCalledWith(message);
		});
	});

	describe('handleCloseEmoji', () => {
		it('routes through the composer when a ref is present', () => {
			const { result, refs } = renderMessageActions();
			const action = jest.fn();

			act(() => {
				result.current.handleCloseEmoji(action, 'params');
			});

			expect(refs.messageComposerRef.current.closeEmojiKeyboardAndAction).toHaveBeenCalledWith(action, 'params');
			expect(action).toHaveBeenCalledWith('params');
		});

		it('calls the action directly when there is no composer ref', () => {
			const refs = createRefs();
			(refs.messageComposerRef as any).current = null;
			const { result } = renderMessageActions({}, refs);
			const action = jest.fn();

			act(() => {
				result.current.handleCloseEmoji(action, 'params');
			});

			expect(action).toHaveBeenCalledWith('params');
		});
	});

	describe('reply', () => {
		it('onReplyInit delegates the message to the thread press', async () => {
			const message = { id: 'msg-1', msg: 'hello' };
			mockGetMessageById.mockResolvedValue(message);
			const { result, onThreadPress, navigation } = renderMessageActions();

			await act(async () => {
				await result.current.onReplyInit('msg-1');
			});

			expect(onThreadPress).toHaveBeenCalledWith(message);
			expect(navigation.push).not.toHaveBeenCalled();
		});

		it('onReplyInit no-ops when the message cannot be found', async () => {
			mockGetMessageById.mockResolvedValue(null);
			const { result, navigation, onThreadPress } = renderMessageActions();

			await act(async () => {
				await result.current.onReplyInit('missing');
			});

			expect(navigation.push).not.toHaveBeenCalled();
			expect(onThreadPress).not.toHaveBeenCalled();
		});
	});
});
