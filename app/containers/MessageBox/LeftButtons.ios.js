import React from 'react';
import PropTypes from 'prop-types';

import { CancelEditingButton, FileButton } from './buttons';

const LeftButtons = React.memo(({
	showFileActions, editing, editCancel
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} />;
	}
	return <FileButton onPress={showFileActions} />;
});

LeftButtons.propTypes = {
	showFileActions: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired
};

export default LeftButtons;
