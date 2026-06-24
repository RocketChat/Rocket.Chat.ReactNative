import { StyleSheet } from 'react-native-unistyles';

import { colors } from './lib/constants/colors';

const themes = {
	light: { colors: colors.light },
	dark: { colors: colors.dark },
	black: { colors: colors.black }
};

type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
	export interface UnistylesThemes extends AppThemes {}
}

const resolveInitialTheme = (): keyof AppThemes => {
	try {
		const { getTheme, initialTheme } = require('./lib/methods/helpers/theme');
		return getTheme(initialTheme());
	} catch {
		return 'light';
	}
};

StyleSheet.configure({
	themes,
	settings: {
		initialTheme: resolveInitialTheme
	}
});
