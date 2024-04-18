import React, { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';

const Edited = memo(({ isEdited, testID }: { isEdited: boolean; testID?: string }) => {
	if (!isEdited) {
		return null;
	}

	return (
		<View testID={testID} style={styles.rightIcons}>
			<CustomIcon name='edit' size={16} />
		</View>
	);
});

export default Edited;
