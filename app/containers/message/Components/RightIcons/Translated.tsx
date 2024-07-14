import React, { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';

const Translated = memo(({ isTranslated }: { isTranslated: boolean }) => {
	if (!isTranslated) {
		return null;
	}

	return (
		<View style={styles.rightIcons}>
			<CustomIcon name='language' size={16} />
		</View>
	);
});

export default Translated;
