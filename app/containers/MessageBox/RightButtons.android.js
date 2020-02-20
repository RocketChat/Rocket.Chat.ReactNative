import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton, FileButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, recordAudioMessageEnabled, showFileActions
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	if (recordAudioMessageEnabled) {
		return (
			<>
				<AudioButton onPress={recordAudioMessage} theme={theme} />
				<FileButton onPress={showFileActions} theme={theme} />
			</>
		);
	}
	return <FileButton onPress={showFileActions} theme={theme} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	recordAudioMessageEnabled: PropTypes.bool,
	showFileActions: PropTypes.func.isRequired
};

export default RightButtons;
