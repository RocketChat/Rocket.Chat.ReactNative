import { type ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { EmojiKeyboard } from '../EmojiKeyboard';
import { MessageComposerProvider, MessageInnerContext } from '~/containers/MessageComposer/context';
import { ComposerProvider } from '~/containers/MessageComposer/ComposerStore';
import { EmojiKeyboardProvider } from '~/containers/MessageComposer/hooks/useEmojiKeyboard';
import { mockedStore } from '~/reducers/mockedStore';
import { MessageActionProvider } from '~/containers/message/stores/MessageActionStore';

const innerContext = (focus: () => void) => ({
	sendMessage: jest.fn(),
	onEmojiSelected: jest.fn(),
	getText: jest.fn(),
	setInput: jest.fn(),
	closeEmojiKeyboardAndAction: jest.fn(),
	focus
});

const Composer = ({ focus, tmid }: { focus: () => void; tmid?: string }): ReactElement => (
	<ComposerProvider rid='rid' roomTitle='Rocket Chat' tmid={tmid} sharing={false}>
		<MessageComposerProvider>
			<EmojiKeyboardProvider>
				<MessageInnerContext.Provider value={innerContext(focus)}>
					<EmojiKeyboard />
				</MessageInnerContext.Provider>
			</EmojiKeyboardProvider>
		</MessageComposerProvider>
	</ComposerProvider>
);

describe('EmojiKeyboard toolbar', () => {
	test('back to keyboard focuses its own composer when a room and a thread composer are both mounted', async () => {
		const focusRoom = jest.fn();
		const focusThread = jest.fn();
		render(
			<Provider store={mockedStore}>
				<MessageActionProvider>
					<Composer focus={focusRoom} />
					<Composer focus={focusThread} tmid='tmid' />
				</MessageActionProvider>
			</Provider>
		);

		const [roomButton] = screen.getAllByTestId('message-composer-close-emoji');
		fireEvent.press(roomButton);

		await waitFor(() => expect(focusRoom).toHaveBeenCalledTimes(1));
		expect(focusThread).not.toHaveBeenCalled();
	});
});
