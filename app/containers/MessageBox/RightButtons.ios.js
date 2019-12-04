import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage
}) => {
	if (showSend) {
		return <SendButton theme={theme} onPress={submit} />;
	}
	return <AudioButton theme={theme} onPress={recordAudioMessage} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired
};

export default RightButtons;
