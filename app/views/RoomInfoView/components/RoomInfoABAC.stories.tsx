import React from 'react';
import { ScrollView, View } from 'react-native';

import { RoomInfoABAC } from './RoomInfoABAC';
import type { TSupportedThemes } from '../../../theme';
import { ThemeContext } from '../../../theme';
import { colors } from '../../../lib/constants/colors';

export default {
	title: 'RoomInfoABAC',
	component: RoomInfoABAC,
	decorators: [
		(Story: any) => (
			<ScrollView>
				<Story />
			</ScrollView>
		)
	]
};

const Story = () => (
	<>
		<RoomInfoABAC abacAttributes={[{ name: 'Chat sensitivity', values: ['Classified', 'Top Secret'] }]} teamMain />
		<RoomInfoABAC
			abacAttributes={[
				{ name: 'Attribute', values: Array.from({ length: 10 }, (_, index) => `Value ${index + 1}`) },
				{ name: 'Chat sensitivity', values: ['Classified', 'Top Secret'] }
			]}
		/>
	</>
);

const ThemeProvider = ({ children, theme }: { children: React.ReactNode; theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<View style={{ backgroundColor: colors[theme].surfaceRoom }}>{children}</View>
	</ThemeContext.Provider>
);

export const Light = () => (
	<ThemeProvider theme='light'>
		<Story />
	</ThemeProvider>
);
export const Dark = () => (
	<ThemeProvider theme='dark'>
		<Story />
	</ThemeProvider>
);
export const Black = () => (
	<ThemeProvider theme='black'>
		<Story />
	</ThemeProvider>
);
