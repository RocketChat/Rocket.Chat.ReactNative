import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';
import { themes } from '../../../constants/colors';

const SendButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-message'
		accessibilityLabel='Send_message'
		icon='send-filled'
		theme={theme}
		color={themes[theme].tintColor}
	/>
));

SendButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default SendButton;
