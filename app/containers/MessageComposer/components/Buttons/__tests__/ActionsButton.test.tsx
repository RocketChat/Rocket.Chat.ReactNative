import { render, screen } from '@testing-library/react-native';

import { type IAppActionButtonItem } from '~/lib/apps/useAppActionButtons';
import { ActionsButton } from '../ActionsButton';

const mockUseAppActionButtons = jest.fn((_params: unknown): IAppActionButtonItem[] => []);
jest.mock('~/lib/apps/useAppActionButtons', () => ({
	useAppActionButtons: (params: unknown) => mockUseAppActionButtons(params)
}));

const mockTriggerAppActionButton = jest.fn();
jest.mock('~/lib/apps/triggerAppActionButton', () => ({
	triggerAppActionButton: (params: unknown) => mockTriggerAppActionButton(params)
}));

const mockShowActionSheet = jest.fn();
jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: jest.fn() })
}));

jest.mock('~/containers/MessageComposer/ComposerStore', () => ({
	useComposerRid: () => 'rid-1',
	useComposerTmid: () => 'tmid-1',
	useComposerType: () => 'c'
}));

jest.mock('~/containers/MessageComposer/context', () => {
	const ReactActual = jest.requireActual('react');
	return {
		MessageInnerContext: ReactActual.createContext({
			closeEmojiKeyboardAndAction: (action: Function, params: unknown) => action(params),
			getText: () => 'draft text'
		})
	};
});

jest.mock('~/containers/MessageComposer/hooks', () => ({
	useCanUploadFile: () => false,
	useChooseMedia: () => ({ takePhoto: jest.fn(), takeVideo: jest.fn(), chooseFromLibrary: jest.fn(), chooseFile: jest.fn() })
}));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [false] }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));

jest.mock('../BaseButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		BaseButton: ({ onPress, testID }: { onPress: () => void; testID: string }) =>
			ReactActual.createElement('BaseButton', { onPress, testID })
	};
});

const item = (id: string, overrides = {}): IAppActionButtonItem => ({
	id,
	label: `Label ${id}`,
	button: { appId: 'app-id', actionId: id, context: 'messageBoxAction', labelI18n: 'label', ...overrides }
});

const openSheet = () => {
	render(<ActionsButton />);
	screen.getByTestId('message-composer-actions').props.onPress();
	return mockShowActionSheet.mock.calls[0][0].options as { title: string; testID?: string; onPress: () => void }[];
};

describe('ActionsButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseAppActionButtons.mockImplementation(() => []);
	});

	it('shows only the built-in actions when no app registered any', () => {
		const options = openSheet();

		expect(options.map(option => option.title)).toEqual(['Create discussion']);
	});

	it('lists ai room actions then message box actions after the built-in ones', () => {
		mockUseAppActionButtons.mockImplementation(params =>
			(params as { context: string }).context === 'messageBoxAction'
				? [item('translate')]
				: [item('summarize', { context: 'roomAction', category: 'ai' })]
		);

		const options = openSheet();

		expect(options.map(option => option.title)).toEqual(['Create discussion', 'Label summarize', 'Label translate']);
		expect(options[1].testID).toBe('message-composer-ai-action-summarize');
		expect(options[2].testID).toBe('message-composer-app-action-translate');
	});

	it('asks for the ai category of the room action context', () => {
		openSheet();

		expect(mockUseAppActionButtons).toHaveBeenCalledWith({ context: 'messageBoxAction', rid: 'rid-1' });
		expect(mockUseAppActionButtons).toHaveBeenCalledWith({ context: 'roomAction', category: 'ai', rid: 'rid-1' });
	});

	it('sends the thread and the composer draft with a message box action', () => {
		const messageBoxItem = item('translate');
		mockUseAppActionButtons.mockImplementation(params =>
			(params as { context: string }).context === 'messageBoxAction' ? [messageBoxItem] : []
		);

		openSheet()[1].onPress();

		expect(mockTriggerAppActionButton).toHaveBeenCalledWith({
			button: messageBoxItem.button,
			rid: 'rid-1',
			tmid: 'tmid-1',
			message: 'draft text'
		});
	});

	it('sends the thread but not the composer draft with an ai action', () => {
		const aiItem = item('summarize', { context: 'roomAction', category: 'ai' });
		mockUseAppActionButtons.mockImplementation(params =>
			(params as { context: string }).context === 'roomAction' ? [aiItem] : []
		);

		openSheet()[1].onPress();

		expect(mockTriggerAppActionButton).toHaveBeenCalledWith({ button: aiItem.button, rid: 'rid-1', tmid: 'tmid-1' });
	});
});
