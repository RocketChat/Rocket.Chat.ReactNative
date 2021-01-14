import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import ActivityIndicator from '../../ActivityIndicator';
import styles from './styles';

const Input = ({
	children, onPress, theme, loading, inputStyle, placeholder, disabled
}) => (
	<Touchable
		onPress={onPress}
		style={[{ backgroundColor: themes[theme].backgroundColor }, inputStyle]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
		disabled={disabled}
	>
		<View style={[styles.input, { borderColor: themes[theme].separatorColor }]}>
			{placeholder ? <Text style={[styles.pickerText, { color: themes[theme].auxiliaryText }]}>{placeholder}</Text> : children}
			{
				loading
					? <ActivityIndicator style={[styles.loading, styles.icon]} />
					: <CustomIcon name='chevron-down' size={22} color={themes[theme].auxiliaryText} style={styles.icon} />
			}
		</View>
	</Touchable>
);
Input.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	theme: PropTypes.string,
	inputStyle: PropTypes.object,
	disabled: PropTypes.bool,
	placeholder: PropTypes.string,
	loading: PropTypes.bool
};

export default Input;
