import { setAppActionButtons, updateAppActionButtons, removeAppActionButtons } from '../actions/appActionButtons';
import { mockedStore } from './mockedStore';
import { initialState } from './appActionButtons';
import { UIActionButtonContext } from '../definitions';

const mockAppActionButtons = {
	actionId: {
		appId: 'test-id',
		actionId: 'test-id',
		context: UIActionButtonContext.MESSAGE_ACTION,
		labelI18n: 'test-label'
	}
};

describe('test appActionButtons reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().appActionButtons;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after call set action', () => {
		mockedStore.dispatch(setAppActionButtons(mockAppActionButtons));
		const state = mockedStore.getState().appActionButtons;
		expect(state).toHaveProperty('actionId');
		expect(state.actionId.context).toEqual(UIActionButtonContext.MESSAGE_ACTION);
	});

	it('should return modified store after call update action', () => {
		mockedStore.dispatch(
			updateAppActionButtons('actionId', { ...mockAppActionButtons.actionId, context: UIActionButtonContext.ROOM_ACTION })
		);
		const state = mockedStore.getState().appActionButtons;
		expect(state).toHaveProperty('actionId');
		expect(state.actionId.context).toEqual(UIActionButtonContext.ROOM_ACTION);
	});

	it('should return modified store after call remove action', () => {
		const stateBeforeRemoval = mockedStore.getState().appActionButtons;
		expect(stateBeforeRemoval).toHaveProperty('actionId');

		mockedStore.dispatch(removeAppActionButtons('actionId'));

		const state = mockedStore.getState().appActionButtons;
		expect(state).toEqual(initialState);
	});
});
