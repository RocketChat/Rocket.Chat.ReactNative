import React from 'react';
import { View } from 'react-native';
import { Row } from 'react-native-easy-grid';

import styles from './styles';
import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../lib/Icons';
import { useTheme } from '../../../theme';

const LockIcon = React.memo(() => {
	const { theme } = useTheme();

	return (
		<Row style={styles.row}>
			<View style={styles.iconView}>
				<CustomIcon name='auth' size={40} color={themes[theme].passcodeLockIcon} />
			</View>
		</Row>
	);
});

export default LockIcon;
