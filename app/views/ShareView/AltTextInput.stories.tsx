import React from 'react';
import { View } from 'react-native';

import AltTextInput from './AltTextInput';

export default {
	title: 'ShareView/AltTextInput'
};

export const Empty = () => (
	<View style={{ padding: 16 }}>
		<AltTextInput value='' onChangeText={() => {}} theme='light' />
	</View>
);

export const Filled = () => (
	<View style={{ padding: 16 }}>
		<AltTextInput
			value='A wavy orange and black pattern, designed to be used as a wallpaper'
			onChangeText={() => {}}
			theme='light'
		/>
	</View>
);

export const DarkTheme = () => (
	<View style={{ padding: 16, backgroundColor: '#1F2329' }}>
		<AltTextInput value='A wavy orange and black pattern' onChangeText={() => {}} theme='dark' />
	</View>
);
