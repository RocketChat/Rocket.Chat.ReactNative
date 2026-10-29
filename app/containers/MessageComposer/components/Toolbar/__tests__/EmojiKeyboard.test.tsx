import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { KeyboardController } from 'react-native-keyboard-controller';

import { EmojiKeyboard } from '../EmojiKeyboard';
import { MessageComposerProvider, MessageInnerContext } from '~/containers/MessageComposer/context';
import { ComposerProvider } from '~/containers/MessageComposer/ComposerStore';
import { EmojiKeyboardProvider } from '~/containers/MessageComposer/hooks/useEmojiKeyboard';
import { mockedStore } from '~/reducers/mockedStore';
import { MessageActionProvider } from '~/containers/message/stores/MessageActionStore';

describe('EmojiKeyboard toolbar', () => {
	test('back to keyboard restores focus and focuses its own composer', async () => {
		const focus = jest.fn();
		render(
			<Provider store={mockedStore}>
				<MessageActionProvider>
					<ComposerProvider rid='rid' roomTitle='Rocket Chat' sharing={false}>
						<MessageComposerProvider>
							<EmojiKeyboardProvider>
								<MessageInnerContext.Provider
									value={{
										sendMessage: jest.fn(),
										onEmojiSelected: jest.fn(),
										getText: jest.fn(),
										setInput: jest.fn(),
										closeEmojiKeyboardAndAction: jest.fn(),
										focus
									}}>
									<EmojiKeyboard />
								</MessageInnerContext.Provider>
							</EmojiKeyboardProvider>
						</MessageComposerProvider>
					</ComposerProvider>
				</MessageActionProvider>
			</Provider>
		);

		fireEvent.press(screen.getByTestId('message-composer-close-emoji'));

		await waitFor(() => expect(focus).toHaveBeenCalledWith(0));
		expect(jest.mocked(KeyboardController.setFocusTo).mock.invocationCallOrder[0]).toBeLessThan(
			focus.mock.invocationCallOrder[0]
		);
		expect(KeyboardController.setFocusTo).toHaveBeenCalledWith('current');
	});
});
