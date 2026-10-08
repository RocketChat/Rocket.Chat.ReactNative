import { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useRoute } from '@react-navigation/native';

import { useAutoSaveDraft } from '../useAutoSaveDraft';
import { MessageComposerProvider, useMessageComposerApi } from '../../context';
import { ComposerProvider } from '../../ComposerStore';
import { createMessageActionStore, MessageActionProvider } from '~/containers/message/stores/MessageActionStore';
import { saveDraftMessage } from '~/lib/methods/draftMessage';

jest.mock('@react-navigation/native', () => ({ useRoute: jest.fn(() => ({ name: 'RoomView' })) }));
jest.mock('~/lib/methods/draftMessage', () => ({ saveDraftMessage: jest.fn() }));

const mockSaveDraftMessage = saveDraftMessage as jest.Mock;
const mockUseRoute = useRoute as jest.Mock;

const renderDraft = ({
	text = '',
	tmid,
	action
}: { text?: string; tmid?: string; action?: Parameters<typeof createMessageActionStore>[0] } = {}) => {
	const textRef = { current: text };
	const messageActionStore = createMessageActionStore(action);
	const wrapper = ({ children }: { children: ReactNode }) => (
		<MessageActionProvider store={messageActionStore}>
			<ComposerProvider roomTitle='Room' rid='room-1' tmid={tmid}>
				<MessageComposerProvider>
					<>{children}</>
				</MessageComposerProvider>
			</ComposerProvider>
		</MessageActionProvider>
	);
	const hook = renderHook(() => ({ ...useAutoSaveDraft(textRef), setFocused: useMessageComposerApi().setFocused }), { wrapper });
	return { ...hook, textRef, messageActionStore };
};

describe('useAutoSaveDraft', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockUseRoute.mockReturnValue({ name: 'RoomView' });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('saves the latest text every 3 seconds while focused', () => {
		const { result, textRef } = renderDraft();

		act(() => result.current.setFocused(true));
		textRef.current = 'hello';
		act(() => jest.advanceTimersByTime(3000));

		expect(mockSaveDraftMessage).toHaveBeenLastCalledWith({ rid: 'room-1', tmid: undefined, draftMessage: 'hello' });
	});

	it('saves on blur and stops the interval', () => {
		const { result, textRef } = renderDraft();

		act(() => result.current.setFocused(true));
		textRef.current = 'typed before blur';
		act(() => result.current.setFocused(false));

		expect(mockSaveDraftMessage).toHaveBeenLastCalledWith({ rid: 'room-1', tmid: undefined, draftMessage: 'typed before blur' });
		mockSaveDraftMessage.mockClear();
		textRef.current = 'typed after blur';
		act(() => jest.advanceTimersByTime(3000));
		expect(mockSaveDraftMessage).not.toHaveBeenCalled();
	});

	it('saves the latest text on unmount', () => {
		const { unmount, textRef } = renderDraft({ tmid: 'thread-1' });

		textRef.current = 'left the room';
		unmount();

		expect(mockSaveDraftMessage).toHaveBeenLastCalledWith({ rid: 'room-1', tmid: 'thread-1', draftMessage: 'left the room' });
	});

	it('saves quotes with the text, reading the action at save time', () => {
		const { result, messageActionStore } = renderDraft({ text: 'about this' });

		act(() => messageActionStore.getState().actions.requestQuote('message-1'));
		act(() => result.current.saveDraft());

		expect(mockSaveDraftMessage).toHaveBeenLastCalledWith({
			rid: 'room-1',
			tmid: undefined,
			draftMessage: JSON.stringify({ quotes: ['message-1'], msg: 'about this' })
		});
	});

	it('saves a reaction target as a quote', () => {
		const { result } = renderDraft({ text: 'nice', action: { kind: 'react', messageId: 'message-2' } });

		act(() => result.current.saveDraft());

		expect(mockSaveDraftMessage).toHaveBeenLastCalledWith({
			rid: 'room-1',
			tmid: undefined,
			draftMessage: JSON.stringify({ quotes: ['message-2'], msg: 'nice' })
		});
	});

	it('never saves while editing a message', () => {
		const { result, unmount } = renderDraft({ text: 'edited text', action: { kind: 'edit', messageId: 'message-3' } });

		act(() => result.current.saveDraft());
		unmount();

		expect(mockSaveDraftMessage).not.toHaveBeenCalled();
	});

	it('never saves from the share view', () => {
		mockUseRoute.mockReturnValue({ name: 'ShareView' });
		const { result, unmount } = renderDraft({ text: 'shared text' });

		act(() => result.current.saveDraft());
		unmount();

		expect(mockSaveDraftMessage).not.toHaveBeenCalled();
	});
});
