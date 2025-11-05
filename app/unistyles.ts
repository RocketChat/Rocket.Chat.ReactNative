import { StyleSheet, type UnistylesThemes } from 'react-native-unistyles';

import { initialTheme } from './lib/methods/helpers/theme';
import { themes } from './lib/constants/colors';

type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
	export interface UnistylesThemes extends AppThemes {}
}

const settings = {
	initialTheme: () => {
        const theme = initialTheme();
        return theme.currentTheme === 'dark' ? theme.darkLevel : (theme.currentTheme as keyof UnistylesThemes) 
    }
};

StyleSheet.configure({
	themes,
	settings
});
