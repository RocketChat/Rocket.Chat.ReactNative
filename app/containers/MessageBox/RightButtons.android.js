import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { SendButton, ActionsButton } from './buttons';
import styles from './styles';

const RightButtons = React.memo(({
	theme, showSend, submit, showMessageBoxActions, isActionsEnabled
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
	}

	return <View style={styles.buttonsWhitespace} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	showMessageBoxActions: PropTypes.func.isRequired,
	isActionsEnabled: PropTypes.bool
};

export default RightButtons;
