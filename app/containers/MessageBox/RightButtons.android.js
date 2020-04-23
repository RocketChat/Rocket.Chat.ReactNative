import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton, ActionsButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, recordAudioMessageEnabled, showMessageBoxActions
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	if (recordAudioMessageEnabled) {
		return (
			<>
				<AudioButton onPress={recordAudioMessage} theme={theme} />
				<ActionsButton onPress={showMessageBoxActions} theme={theme} />
			</>
		);
	}
	return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	recordAudioMessageEnabled: PropTypes.bool,
	showMessageBoxActions: PropTypes.func.isRequired
};

export default RightButtons;
