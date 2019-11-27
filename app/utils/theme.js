import { Appearance } from 'react-native-appearance';

export const defaultTheme = Appearance.getColorScheme() && Appearance.getColorScheme() !== 'no-preference'
	? Appearance.getColorScheme()
	: 'light';
