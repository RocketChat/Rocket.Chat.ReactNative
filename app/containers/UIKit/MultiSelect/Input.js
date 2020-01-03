import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../../lib/Icons';
import Touch from '../../../utils/touch';
import { themes } from '../../../constants/colors';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';

const Input = ({
	children, open, theme, loading
}) => (
	<Touch
		onPress={() => open(true)}
		style={{ backgroundColor: themes[theme].backgroundColor }}
		theme={theme}
	>
		<View style={[styles.input, { borderColor: themes[theme].separatorColor }]}>
			{children}
			{
				loading
					? <ActivityIndicator style={[styles.loading, styles.icon]} />
					: <CustomIcon name='arrow-down' size={22} color={themes[theme].auxiliaryText} style={styles.icon} />
			}
		</View>
	</Touch>
);
Input.propTypes = {
	children: PropTypes.node,
	open: PropTypes.func,
	theme: PropTypes.string,
	loading: PropTypes.bool
};

export default Input;
