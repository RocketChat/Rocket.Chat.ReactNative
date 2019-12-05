import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const AudioButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-send-audio'
		accessibilityLabel='Send_audio_message'
		icon='mic'
		theme={theme}
	/>
));

AudioButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default AudioButton;
