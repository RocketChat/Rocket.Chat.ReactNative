import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { themes } from '~/lib/constants/colors';
import { setNativeTheme } from '../theme';

jest.mock('../deviceInfo', () => ({ isAndroid: false }));
jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn() }));
jest.mock('@zoontek/react-native-navigation-bar', () => ({ NavigationBar: { setBarStyle: jest.fn() } }));

describe('setNativeTheme on iOS', () => {
	const systemColorScheme = 'light';
	let colorSchemeOverride: 'light' | 'dark' | 'unspecified';

	beforeEach(() => {
		colorSchemeOverride = 'unspecified';
		jest.spyOn(Appearance, 'setColorScheme').mockImplementation(scheme => {
			colorSchemeOverride = scheme ?? 'unspecified';
		});
		jest
			.spyOn(Appearance, 'getColorScheme')
			.mockImplementation(() => (colorSchemeOverride === 'unspecified' ? systemColorScheme : colorSchemeOverride));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('resolves the system theme when switching from explicit dark to automatic', () => {
		setNativeTheme({ currentTheme: 'dark', darkLevel: 'black' });

		setNativeTheme({ currentTheme: 'automatic', darkLevel: 'black' });

		expect(colorSchemeOverride).toBe('unspecified');
		expect(SystemUI.setBackgroundColorAsync).toHaveBeenLastCalledWith(themes.light.surfaceNeutral);
	});
});
