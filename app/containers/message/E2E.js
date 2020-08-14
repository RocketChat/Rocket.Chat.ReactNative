import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { E2E_MESSAGE_TYPE } from '../../lib/encryption/constants';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import styles from './styles';

const E2E = React.memo(({ type, hide, theme }) => {
	if (type !== E2E_MESSAGE_TYPE || hide) {
		return null;
	}

	return (
		<View style={styles.encrypted}>
			<CustomIcon name='encrypted' size={16} color={themes[theme].auxiliaryText} />
		</View>
	);
});
E2E.propTypes = {
	type: PropTypes.string,
	hide: PropTypes.string,
	theme: PropTypes.string
};

export default E2E;
