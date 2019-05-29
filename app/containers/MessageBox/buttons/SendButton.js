import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const SendButton = React.memo(({ onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-message'
		accessibilityLabel='Send_message'
		icon='send1'
	/>
));

SendButton.propTypes = {
	onPress: PropTypes.func.isRequired
};

export default SendButton;
