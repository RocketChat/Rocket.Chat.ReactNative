import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, AudioButton, FileButton } from './buttons';

const RightButtons = React.memo(({
	showSend, submit, recordAudioMessage, showFileActions
}) => {
	if (showSend) {
		return <SendButton onPress={submit} />;
	}
	return (
		<React.Fragment>
			<AudioButton onPress={recordAudioMessage} />
			<FileButton onPress={showFileActions} />
		</React.Fragment>
	);
});

RightButtons.propTypes = {
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	showFileActions: PropTypes.func.isRequired
};

export default RightButtons;
