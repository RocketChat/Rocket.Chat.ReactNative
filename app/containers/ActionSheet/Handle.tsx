import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { testProps } from '../../lib/methods/testProps';

export const Handle = React.memo(() => {
	const { theme } = useTheme();
	return (
		<View style={[styles.handle, { backgroundColor: themes[theme].focusedBackground }]} {...testProps('action-sheet-handle')}>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
		</View>
	);
});
