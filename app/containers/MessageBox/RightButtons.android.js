import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton, FileButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, showFileActions
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	return (
		<>
			<AudioButton onPress={recordAudioMessage} theme={theme} />
			<FileButton onPress={showFileActions} theme={theme} />
		</>
	);
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	showFileActions: PropTypes.func.isRequired
};

export default RightButtons;
