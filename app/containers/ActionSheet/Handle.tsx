import { View } from 'react-native';
import { memo } from 'react';

import styles from './styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';

export const Handle = memo(() => {
	'use memo';

	const { theme } = useTheme();
	return (
		<View style={styles.handle} testID='action-sheet-handle'>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].fontSecondaryInfo }]} />
		</View>
	);
});
