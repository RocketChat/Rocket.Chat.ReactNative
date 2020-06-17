import React from 'react';
import PropTypes from 'prop-types';

import { SendButton, ActionsButton } from './buttons';

const RightButtons = React.memo(({
	theme, showSend, submit, showMessageBoxActions
}) => {
	if (showSend) {
		return <SendButton onPress={submit} theme={theme} />;
	}
	return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired,
	showMessageBoxActions: PropTypes.func.isRequired
};

export default RightButtons;
