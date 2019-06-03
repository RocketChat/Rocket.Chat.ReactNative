import React from 'react';
import PropTypes from 'prop-types';

import { CancelEditingButton, ToggleEmojiButton } from './buttons';

const LeftButtons = React.memo(({
	showEmojiKeyboard, editing, editCancel, openEmoji, closeEmoji
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} />;
	}
	return (
		<ToggleEmojiButton
			show={showEmojiKeyboard}
			open={openEmoji}
			close={closeEmoji}
		/>
	);
});

LeftButtons.propTypes = {
	showEmojiKeyboard: PropTypes.bool,
	openEmoji: PropTypes.func.isRequired,
	closeEmoji: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired
};

export default LeftButtons;
