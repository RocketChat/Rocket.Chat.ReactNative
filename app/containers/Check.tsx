import React from 'react';
import { StyleSheet } from 'react-native';

import { CustomIcon } from './CustomIcon';
import { themes } from '../lib/constants';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	icon: {
		width: 22,
		height: 22,
		marginHorizontal: 15
	}
});

const Check = React.memo(() => {
	const { theme } = useTheme();
	return <CustomIcon style={styles.icon} color={themes[theme].badgeBackgroundLevel2} size={22} name='check' />;
});

export default Check;
