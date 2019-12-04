import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const SendButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-message'
		accessibilityLabel='Send_message'
		icon='send1'
		theme={theme}
	/>
));

SendButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default SendButton;
