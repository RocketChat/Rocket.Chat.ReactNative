import { clearEnterpriseModules, setEnterpriseModules } from '../actions/enterpriseModules';
import { mockedStore } from './mockedStore';
import { initialState } from './enterpriseModules';

describe('test enterpriseModules reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().enterpriseModules;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after setEnterpriseModules', () => {
		const modules = ['omnichannel-mobile-enterprise', 'livechat-enterprise'];
		mockedStore.dispatch(setEnterpriseModules(modules));
		const state = mockedStore.getState().enterpriseModules;
		expect(state).toEqual(modules);
	});

	it('should return empty store after setEnterpriseModules', () => {
		mockedStore.dispatch(clearEnterpriseModules());
		const state = mockedStore.getState().enterpriseModules;
		expect(state).toEqual([]);
	});
});
