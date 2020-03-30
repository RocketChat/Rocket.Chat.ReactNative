import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const ActionsButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-actions'
		accessibilityLabel='Message_actions'
		icon='plus'
		theme={theme}
	/>
));

ActionsButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default ActionsButton;
