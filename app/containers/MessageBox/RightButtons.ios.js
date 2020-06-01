import React from 'react';
import PropTypes from 'prop-types';

import { SendButton } from './buttons';

const RightButtons = React.memo(({ theme, showSend, submit }) => {
	if (showSend) {
		return <SendButton theme={theme} onPress={submit} />;
	}
	return null;
});

RightButtons.propTypes = {
	theme: PropTypes.string,
	showSend: PropTypes.bool,
	submit: PropTypes.func.isRequired
};

export default RightButtons;
