import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const AudioButton = React.memo(({ onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-audio'
		accessibilityLabel='Send_audio_message'
		icon='mic'
	/>
));

AudioButton.propTypes = {
	onPress: PropTypes.func.isRequired
};

export default AudioButton;
