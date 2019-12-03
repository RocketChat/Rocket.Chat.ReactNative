import { Appearance } from 'react-native-appearance';

export const defaultTheme = () => {
	const colorScheme = Appearance.getColorScheme();
	if (colorScheme && colorScheme !== 'no-preference') {
		return colorScheme;
	}
	return 'light';
};

export const getTheme = (colorScheme) => {
	const { darkLevel, currentTheme } = colorScheme;
	let color = currentTheme;
	if (currentTheme === 'automatic') {
		color = defaultTheme();
	}
	return color === 'dark' ? darkLevel : 'light';
};
