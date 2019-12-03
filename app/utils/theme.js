import { Appearance } from 'react-native-appearance';

export const defaultTheme = () => {
	const colorScheme = Appearance.getColorScheme();
	if (colorScheme && colorScheme !== 'no-preference') {
		return colorScheme;
	}
	return 'light';
};

export const navigationTheme = theme => (theme === 'light' ? 'light' : 'dark');
