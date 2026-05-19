import React from 'react';
import { View } from 'react-native';

import AltTextInput from './AltTextInput';
import { ThemeContext, type TSupportedThemes } from '../../theme';
import { colors } from '../../lib/constants/colors';

export default {
	title: 'ShareView/AltTextInput'
};

const Themed = ({ theme, children }: { theme: TSupportedThemes; children: React.ReactNode }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>{children}</ThemeContext.Provider>
);

export const Empty = () => (
	<Themed theme='light'>
		<View style={{ padding: 16 }}>
			<AltTextInput value='' onChangeText={() => {}} />
		</View>
	</Themed>
);

export const Filled = () => (
	<Themed theme='light'>
		<View style={{ padding: 16 }}>
			<AltTextInput value='A wavy orange and black pattern, designed to be used as a wallpaper' onChangeText={() => {}} />
		</View>
	</Themed>
);

export const DarkTheme = () => (
	<Themed theme='dark'>
		<View style={{ padding: 16, backgroundColor: '#1F2329' }}>
			<AltTextInput value='A wavy orange and black pattern' onChangeText={() => {}} />
		</View>
	</Themed>
);
