import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton } from './buttons';

const RightButtons = React.memo(({
	showSend, submit, recordAudioMessage
}) => {
	if (showSend) {
		return <SendButton onPress={submit} />;
	}
	return <AudioButton onPress={recordAudioMessage} />;
});

RightButtons.propTypes = {
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired
};

export default RightButtons;
