import React from 'react';
import PropTypes from 'prop-types';

import { CancelEditingButton, FileButton } from './buttons';

const LeftButtons = React.memo(({
	theme, showFileActions, editing, editCancel
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} theme={theme} />;
	}
	return <FileButton onPress={showFileActions} theme={theme} />;
});

LeftButtons.propTypes = {
	theme: PropTypes.string,
	showFileActions: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired
};

export default LeftButtons;
