import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { themes } from '~/lib/constants/colors';
import { ThemeContext, type TSupportedThemes } from '~/theme';

const THEMES: TSupportedThemes[] = ['light', 'dark', 'black'];

const styles = StyleSheet.create({
	frame: {
		marginBottom: 16
	}
});

export const ThemedStory = ({ theme, children }: { theme: TSupportedThemes; children: ReactElement }): ReactElement => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<View style={[styles.frame, { backgroundColor: themes[theme].surfaceRoom }]}>{children}</View>
	</ThemeContext.Provider>
);

export const AllThemes = ({ children }: { children: (theme: TSupportedThemes) => ReactElement }): ReactElement => (
	<View>
		{THEMES.map(theme => (
			<ThemedStory key={theme} theme={theme}>
				{children(theme)}
			</ThemedStory>
		))}
	</View>
);
