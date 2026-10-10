import { clearEnterpriseModules, setEnterpriseModules } from '~/actions/enterpriseModules';
import { selectServerSuccess } from '~/actions/server';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '../../store/auxStore';
import { getEnterpriseModules } from '../enterpriseModules';

const mockGet = jest.fn();
const mockMethodCallWrapper = jest.fn();
const mockServerUpdate = jest.fn();

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		get: (...args: unknown[]) => mockGet(...args),
		methodCallWrapper: (...args: unknown[]) => mockMethodCallWrapper(...args)
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: () => ({
				find: () =>
					Promise.resolve({
						update: (updater: (server: { enterpriseModules?: string }) => void) => {
							const server: { enterpriseModules?: string } = {};
							updater(server);
							mockServerUpdate(server);
						}
					})
			}),
			write: (writer: () => Promise<void>) => writer()
		}
	}
}));

jest.mock('../helpers/log', () => jest.fn());

const connectToServerVersion = (version: string) => {
	mockedStore.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version, name: 'Open' }));
};

describe('getEnterpriseModules', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(clearEnterpriseModules());
	});

	it('reads active modules from licenses.info on 6.5.0 and later', async () => {
		connectToServerVersion('6.5.0');
		mockGet.mockResolvedValue({ success: true, license: { activeModules: ['teams-voip', 'livechat-enterprise'] } });

		await getEnterpriseModules();

		expect(mockGet).toHaveBeenCalledWith('licenses.info');
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
		expect(mockedStore.getState().enterpriseModules).toEqual(['teams-voip', 'livechat-enterprise']);
		expect(mockServerUpdate).toHaveBeenCalledWith({
			enterpriseModules: 'teams-voip,livechat-enterprise',
			hasValidLicense: false
		});
	});

	it('stores whether licenses.info reports a valid license', async () => {
		connectToServerVersion('8.9.0');
		mockGet.mockResolvedValue({ success: true, license: { activeModules: ['teams-voip'], hasValidLicense: true } });

		await getEnterpriseModules();

		expect(mockedStore.getState().hasValidLicense).toBe(true);
		expect(mockServerUpdate).toHaveBeenCalledWith({ enterpriseModules: 'teams-voip', hasValidLicense: true });
	});

	it('clears the valid license when licenses.info is unsuccessful', async () => {
		connectToServerVersion('8.9.0');
		mockedStore.dispatch(setEnterpriseModules(['teams-voip'], true));
		mockGet.mockResolvedValue({ success: false, error: 'unauthorized' });

		await getEnterpriseModules();

		expect(mockedStore.getState().hasValidLicense).toBe(false);
	});

	it('clears modules when licenses.info is unsuccessful', async () => {
		connectToServerVersion('8.9.0');
		mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
		mockGet.mockResolvedValue({ success: false, error: 'unauthorized' });

		await getEnterpriseModules();

		expect(mockedStore.getState().enterpriseModules).toEqual([]);
		expect(mockServerUpdate).not.toHaveBeenCalled();
	});

	it('uses the license:getModules method before 6.5.0', async () => {
		connectToServerVersion('6.4.1');
		mockMethodCallWrapper.mockResolvedValue(['teams-voip']);

		await getEnterpriseModules();

		expect(mockMethodCallWrapper).toHaveBeenCalledWith('license:getModules');
		expect(mockGet).not.toHaveBeenCalled();
		expect(mockedStore.getState().enterpriseModules).toEqual(['teams-voip']);
	});

	it('clears modules on servers older than 3.1.0', async () => {
		connectToServerVersion('3.0.0');
		mockedStore.dispatch(setEnterpriseModules(['teams-voip']));

		await getEnterpriseModules();

		expect(mockGet).not.toHaveBeenCalled();
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
		expect(mockedStore.getState().enterpriseModules).toEqual([]);
	});

	it('keeps current modules when the request throws', async () => {
		connectToServerVersion('8.9.0');
		mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
		mockGet.mockRejectedValue(new Error('network'));

		await getEnterpriseModules();

		expect(mockedStore.getState().enterpriseModules).toEqual(['teams-voip']);
		expect(mockServerUpdate).not.toHaveBeenCalled();
	});
});
