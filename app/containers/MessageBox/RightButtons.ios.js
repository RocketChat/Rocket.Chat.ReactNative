import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, recordAudioMessageEnabled
}) => {
	if (showSend) {
		return <SendButton theme={theme} onPress={submit} />;
	}
	if (recordAudioMessageEnabled) {
		return <AudioButton theme={theme} onPress={recordAudioMessage} />;
	}
	return null;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	recordAudioMessageEnabled: PropTypes.bool
};

export default RightButtons;
