import { removeAppActionButtonsByAppId, setAppActionButtons } from '../actions/appActionButtons';
import { mockedStore } from './mockedStore';
import { initialState } from './appActionButtons';
import { UIActionButtonContext } from '../definitions';

const mockAppActionButtons = {
	'appId/action1': {
		appId: 'appId',
		actionId: 'action1',
		context: UIActionButtonContext.MESSAGE_ACTION,
		labelI18n: 'test-label'
	},
	'appId/action2': {
		appId: 'appId',
		actionId: 'action2',
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
		expect(state).toHaveProperty('appId/action1');
		expect(state).toHaveProperty('appId/action2');
		expect(state['appId/action1'].context).toEqual(UIActionButtonContext.MESSAGE_ACTION);
	});

	it('should return modified store after remove by appId action', () => {
		const stateBeforeRemoval = mockedStore.getState().appActionButtons;
		expect(stateBeforeRemoval).toHaveProperty('appId/action1');
		expect(stateBeforeRemoval).toHaveProperty('appId/action2');
		mockedStore.dispatch(removeAppActionButtonsByAppId('appId'));

		const state = mockedStore.getState().appActionButtons;
		expect(state).toEqual(initialState);
	});
});
