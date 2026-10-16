import { fireEvent, render, screen } from '@testing-library/react-native';

import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { ActionsButton } from '../ActionsButton';

const mockUseComposerAppActionOptions = jest.fn((_params: unknown): TActionSheetOptionsItem[] => []);
jest.mock('~/lib/apps/useComposerAppActionOptions', () => ({
	useComposerAppActionOptions: (params: unknown) => mockUseComposerAppActionOptions(params)
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
	return mockShowActionSheet.mock.calls[0][0].options as { title: string; testID?: string; onPress: () => void }[];
};

describe('ActionsButton', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseComposerAppActionOptions.mockImplementation(() => []);
	});

	it('shows only the built-in actions when no app registered any', () => {
		const options = openSheet();

		expect(options.map(option => option.title)).toEqual(['Create discussion']);
	});

	it('lists app actions after the built-in ones', () => {
		mockUseComposerAppActionOptions.mockImplementation(() => [
			{ title: 'Summarize', icon: 'stars', onPress: jest.fn() },
			{ title: 'Translate', icon: 'apps', onPress: jest.fn() }
		]);

		const options = openSheet();

		expect(options.map(option => option.title)).toEqual(['Create discussion', 'Summarize', 'Translate']);
	});

	it('passes the room, the thread and the draft getter to the app options', () => {
		openSheet();

		const [params] = mockUseComposerAppActionOptions.mock.calls[0] as [{ rid: string; tmid: string; getText: () => string }];
		expect(params).toMatchObject({ rid: 'rid-1', tmid: 'tmid-1' });
		expect(params.getText()).toBe('draft text');
	});
});
