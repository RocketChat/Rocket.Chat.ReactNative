import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';

export const Handle = React.memo(() => {
	const { theme } = useTheme();
	return (
		<View style={styles.handle} testID='action-sheet-handle'>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].fontSecondaryInfo }]} />
		</View>
	);
});
