import React, { memo } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';
import styles from '../../styles';

const Translated = memo(({ isTranslated }: { isTranslated: boolean }) => {
	const { colors } = useTheme();

	if (!isTranslated) {
		return null;
	}

	return (
		<View style={styles.rightIcons}>
			<CustomIcon name='language' size={16} color={colors.auxiliaryText} />
		</View>
	);
});

export default Translated;
