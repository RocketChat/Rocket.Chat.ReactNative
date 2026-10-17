import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActionsButton } from '../ActionsButton';

jest.mock('~/lib/apps/useComposerAppActionOptions', () => ({
	useComposerAppActionOptions: () => [
		{ title: 'Summarize', icon: 'stars', onPress: jest.fn() },
		{ title: 'Translate', icon: 'apps', onPress: jest.fn() }
	]
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

const openSheet = () => {
	render(<ActionsButton />);
	fireEvent.press(screen.getByTestId('message-composer-actions'));
	return mockShowActionSheet.mock.calls[0][0].options as { title: string }[];
};

describe('ActionsButton', () => {
	it('lists app actions after the built-in ones', () => {
		const options = openSheet();

		expect(options.map(option => option.title)).toEqual(['Create discussion', 'Summarize', 'Translate']);
	});
});
