import { renderHook } from '@testing-library/react-native';

import { type IAppActionButtonItem } from '../useAppActionButtons';
import { useComposerAppActionOptions } from '../useComposerAppActionOptions';

let mockItems: IAppActionButtonItem[] = [];
jest.mock('../useAppActionButtons', () => ({
	useAppActionButtons: () => mockItems
}));

const mockTriggerAppActionButton = jest.fn();
jest.mock('../triggerActions', () => ({
	triggerAppActionButton: (params: unknown) => mockTriggerAppActionButton(params)
}));

const item = (id: string, overrides = {}): IAppActionButtonItem => ({
	id,
	label: `Label ${id}`,
	button: { appId: 'app-id', actionId: id, context: 'messageBoxAction', labelI18n: 'label', ...overrides }
});

const renderOptions = () =>
	renderHook(() => useComposerAppActionOptions({ rid: 'rid-1', tmid: 'tmid-1', getText: () => 'draft text' })).result.current;

describe('useComposerAppActionOptions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockItems = [];
	});

	it('returns nothing when no app registered any action', () => {
		expect(renderOptions()).toEqual([]);
	});

	it('lists ai room actions then default message box actions', () => {
		mockItems = [
			item('translate'),
			item('composer-ai', { category: 'ai' }),
			item('summarize', { context: 'roomAction', category: 'ai' }),
			item('room-default', { context: 'roomAction' })
		];

		const options = renderOptions();

		expect(options.map(option => [option.title, option.icon, option.testID])).toEqual([
			['Label summarize', 'stars', 'message-composer-ai-action-summarize'],
			['Label translate', 'apps', 'message-composer-app-action-translate']
		]);
	});

	it('marks danger buttons', () => {
		mockItems = [item('delete', { variant: 'danger' }), item('translate')];

		expect(renderOptions().map(option => option.danger)).toEqual([true, false]);
	});

	it('sends the thread and the composer draft when pressed', () => {
		const messageBoxItem = item('translate');
		mockItems = [messageBoxItem];

		renderOptions()[0].onPress();

		expect(mockTriggerAppActionButton).toHaveBeenCalledWith({
			button: messageBoxItem.button,
			rid: 'rid-1',
			tmid: 'tmid-1',
			message: 'draft text'
		});
	});
});
