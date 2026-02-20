import { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';

const Translated = ({ isTranslated }: { isTranslated: boolean }) => {
	'use memo';

	if (!isTranslated) {
		return null;
	}

	return (
		<View style={styles.rightIcons}>
			<CustomIcon name='language' size={16} />
		</View>
	);
};

export default memo(Translated);
