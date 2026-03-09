import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import Touch from '../Touch';

export const Handle = ({ onPress }: { onPress: () => void }) => {
	const { theme } = useTheme();
	return (
		<Touch onPress={onPress} style={styles.handle} testID='action-sheet-handle'>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].fontSecondaryInfo }]} />
		</Touch>
	);
};
