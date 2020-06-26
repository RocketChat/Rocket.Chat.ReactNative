import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { SendButton, AudioButton, ActionsButton } from './buttons';
import styles from './styles';

const RightButtons = React.memo(({
	theme, showSend, submit, recordAudioMessage, recordAudioMessageEnabled, showMessageBoxActions, isActionsEnabled
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	if (recordAudioMessageEnabled || isActionsEnabled) {
		return (
			<>
				{recordAudioMessageEnabled ? <AudioButton onPress={recordAudioMessage} theme={theme} /> : null}
				{isActionsEnabled ? <ActionsButton onPress={showMessageBoxActions} theme={theme} /> : null}
			</>
		);
	}
	return <View style={styles.buttonsWhitespace} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	recordAudioMessage: PropTypes.func.isRequired,
	recordAudioMessageEnabled: PropTypes.bool,
	showMessageBoxActions: PropTypes.func.isRequired,
	isActionsEnabled: PropTypes.bool
};

export default RightButtons;
