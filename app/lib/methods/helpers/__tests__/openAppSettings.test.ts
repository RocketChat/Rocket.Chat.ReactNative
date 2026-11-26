import { Linking } from 'react-native';

import { openAppSettings } from '../openAppSettings';
import log from '../log';

let mockIsIOS = true;
jest.mock('../deviceInfo', () => ({
	get isIOS() {
		return mockIsIOS;
	}
}));
jest.mock('../log', () => ({ __esModule: true, default: jest.fn() }));

const openURL = jest.spyOn(Linking, 'openURL');
const openSettings = jest.spyOn(Linking, 'openSettings');
const mockedLog = log as jest.Mock;

describe('openAppSettings', () => {
	beforeEach(() => {
		mockIsIOS = true;
		jest.clearAllMocks();
	});

	it('opens the iOS app settings URL', async () => {
		openURL.mockResolvedValueOnce(true);

		await openAppSettings();

		expect(openURL).toHaveBeenCalledWith('app-settings:');
		expect(openSettings).not.toHaveBeenCalled();
	});

	it('opens the Android app settings screen', async () => {
		mockIsIOS = false;
		openSettings.mockResolvedValueOnce(undefined);

		await openAppSettings();

		expect(openSettings).toHaveBeenCalledTimes(1);
		expect(openURL).not.toHaveBeenCalled();
	});

	it('logs instead of rejecting when the settings screen cannot be opened', async () => {
		const error = new Error('unavailable');
		openURL.mockRejectedValueOnce(error);

		await expect(openAppSettings()).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(error);
	});
});
