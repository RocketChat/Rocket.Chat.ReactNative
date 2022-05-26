import React, { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants';
import styles from '../../styles';

const Edited = memo(({ isEdited, testID }: { isEdited: boolean; testID?: string }) => {
	const { theme } = useTheme();

	if (!isEdited) {
		return null;
	}

	return (
		<View testID={testID} style={styles.rightIcons}>
			<CustomIcon name='edit' size={16} color={themes[theme].auxiliaryText} />
		</View>
	);
});

export default Edited;
