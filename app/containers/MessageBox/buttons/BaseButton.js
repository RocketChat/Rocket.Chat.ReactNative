import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';

import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import styles from '../styles';
import I18n from '../../../i18n';

const BaseButton = React.memo(({
	onPress, testID, accessibilityLabel, icon, theme, color
}) => (
	<BorderlessButton
		onPress={onPress}
		style={styles.actionButton}
		testID={testID}
		accessibilityLabel={I18n.t(accessibilityLabel)}
		accessibilityTraits='button'
	>
		<CustomIcon name={icon} size={24} color={color ?? themes[theme].auxiliaryTintColor} />
	</BorderlessButton>
));

BaseButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	accessibilityLabel: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	color: PropTypes.string
};

export default BaseButton;
