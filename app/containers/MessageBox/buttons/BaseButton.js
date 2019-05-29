import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';

import { COLOR_PRIMARY } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import styles from '../styles';
import I18n from '../../../i18n';

const BaseButton = React.memo(({
	onPress, testID, accessibilityLabel, icon
}) => (
	<BorderlessButton
		onPress={onPress}
		style={styles.actionButton}
		testID={testID}
		accessibilityLabel={I18n.t(accessibilityLabel)}
		accessibilityTraits='button'
	>
		<CustomIcon name={icon} size={23} color={COLOR_PRIMARY} />
	</BorderlessButton>
));

BaseButton.propTypes = {
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	accessibilityLabel: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired
};

export default BaseButton;
