import { clearEnterpriseModules, setEnterpriseModules } from '../../actions/enterpriseModules';
import { initStore } from '../store/auxStore';
import { mockedStore } from '../../reducers/mockedStore';
import { isVoipModuleAvailable } from './enterpriseModules';

describe('isVoipModuleAvailable', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		mockedStore.dispatch(clearEnterpriseModules());
	});

	it('returns false when enterpriseModules is empty', () => {
		expect(isVoipModuleAvailable()).toBe(false);
	});

	it('returns false when teams-voip is absent', () => {
		mockedStore.dispatch(setEnterpriseModules(['omnichannel-mobile-enterprise']));
		expect(isVoipModuleAvailable()).toBe(false);
	});

	it('returns true when teams-voip is present', () => {
		mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
		expect(isVoipModuleAvailable()).toBe(true);
	});
});
