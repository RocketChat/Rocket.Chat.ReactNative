import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const OpenFullScreenButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-full-screen'
		accessibilityLabel='Message_full_screen'
		icon='expand-arrow'
		theme={theme}
	/>
));

OpenFullScreenButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default OpenFullScreenButton;
