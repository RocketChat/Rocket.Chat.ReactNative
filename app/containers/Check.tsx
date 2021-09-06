import React from 'react';
import { StyleSheet } from 'react-native';

import { CustomIcon } from '../lib/Icons';
import { themes } from '../constants/colors';

interface ICheck {
	style?: object;
	theme: string;
}
const styles = StyleSheet.create({
	icon: {
		width: 22,
		height: 22,
		marginHorizontal: 15
	}
});

const Check = React.memo(({ theme, style }: ICheck) => (
	<CustomIcon style={[styles.icon, style]} color={themes[theme].tintColor} size={22} name='check' />
));

export default Check;
