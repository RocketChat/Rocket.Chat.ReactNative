import React from 'react';
import { View } from 'react-native';
import { Row } from 'react-native-easy-grid';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';

const LockIcon = React.memo(({ theme }) => (
	<Row style={styles.row}>
		<View style={styles.iconView}>
			<CustomIcon name='auth' size={40} color={themes[theme].passcodeLockIcon} />
		</View>
	</Row>
));

LockIcon.propTypes = {
	theme: PropTypes.string
};

export default LockIcon;
