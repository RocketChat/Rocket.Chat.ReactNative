import React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { themes } from '../../constants/colors';

export const Handle = React.memo(({ theme }: { theme: string }) => (
	<View style={[styles.handle, { backgroundColor: themes[theme].focusedBackground }]} testID='action-sheet-handle'>
		<View style={[styles.handleIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
	</View>
));
