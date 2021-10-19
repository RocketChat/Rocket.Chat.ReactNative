import React from 'react';
import PropTypes from 'prop-types';
import { themes } from '../../../constants/colors';
import BaseButton from './BaseButton';

const ActionsButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-actions'
		accessibilityLabel='Message_actions'
		icon='add'
		theme={theme}
		color={themes[theme].tintColor}
	/>
));

ActionsButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default ActionsButton;
