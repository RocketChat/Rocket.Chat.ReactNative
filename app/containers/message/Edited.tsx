import React, { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../lib/Icons';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';

const Edited = memo(({ isEdited }: { isEdited: boolean }) => {
	const { theme } = useTheme();

	if (!isEdited) {
		return null;
	}

	return (
		<View style={styles.leftIcons}>
			<CustomIcon name='edit' size={18} color={themes[theme].auxiliaryText} />
		</View>
	);
});

export default Edited;
