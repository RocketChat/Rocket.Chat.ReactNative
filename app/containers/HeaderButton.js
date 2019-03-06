import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../lib/Icons';
import { isIOS } from '../utils/deviceInfo';

const margin = 10;
const iconColor = isIOS ? '#1D74F5' : '#FFF';

const styles = StyleSheet.create({
	icon: {
		padding: 4
	},
	left: {
		marginLeft: margin
	},
	right: {
		marginRight: margin
	}
});

const HeaderButton = React.memo(({
	icon, onPress, left, right
}) => (
	<BorderlessButton onPress={onPress} style={[left && styles.left, right && styles.right]}>
		<CustomIcon name={icon} size={24} color={iconColor} style={styles.icon} />
	</BorderlessButton>
));

HeaderButton.propTypes = {
	icon: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	left: PropTypes.bool,
	right: PropTypes.bool
};

export default HeaderButton;
