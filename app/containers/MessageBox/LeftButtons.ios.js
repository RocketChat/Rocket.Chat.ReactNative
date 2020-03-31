import React from 'react';
import PropTypes from 'prop-types';

import { CancelEditingButton, ActionsButton } from './buttons';

const LeftButtons = React.memo(({
	theme, showMessageBoxActions, editing, editCancel
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} theme={theme} />;
	}
	return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
});

LeftButtons.propTypes = {
	theme: PropTypes.string,
	showMessageBoxActions: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired
};

export default LeftButtons;
