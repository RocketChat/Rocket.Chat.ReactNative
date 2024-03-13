import React from 'react';
import { View } from 'react-native';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';

const LockIcon = () => {
	const { colors } = useTheme();

	return (
		<Row style={styles.row}>
			<View style={styles.iconView}>
				<CustomIcon name='auth' size={40} color={colors.fontSecondaryInfo} />
			</View>
		</Row>
	);
};

export default LockIcon;
