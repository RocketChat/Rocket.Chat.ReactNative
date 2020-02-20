import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';

const Input = ({
	children, open, theme, loading
}) => (
	<Touchable
		onPress={() => open(true)}
		style={{ backgroundColor: themes[theme].backgroundColor }}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		<View style={[styles.input, { borderColor: themes[theme].separatorColor }]}>
			{children}
			{
				loading
					? <ActivityIndicator style={[styles.loading, styles.icon]} />
					: <CustomIcon name='arrow-down' size={22} color={themes[theme].auxiliaryText} style={styles.icon} />
			}
		</View>
	</Touchable>
);
Input.propTypes = {
	children: PropTypes.node,
	open: PropTypes.func,
	theme: PropTypes.string,
	loading: PropTypes.bool
};

export default Input;
