import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, RecordAudioButton, ActionsButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, recordAudioMessageEnabled, showMessageBoxActions, recording
}) => {
	const actionsButton = recording ? null : <ActionsButton onPress={showMessageBoxActions} theme={theme} />;

	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	if (recordAudioMessageEnabled) {
		return (
			<>
				{actionsButton}
				<RecordAudioButton onPress={recordAudioMessage} theme={theme} />
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
	showMessageBoxActions: PropTypes.func.isRequired,
	recording: PropTypes.bool.isRequired
};

export default RightButtons;
