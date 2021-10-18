import React from 'react';
import PropTypes from 'prop-types';

import { CancelEditingButton, ToggleEmojiButton } from './buttons';

const LeftButtons = React.memo(({
	theme, showEmojiKeyboard, editing, editCancel, openEmoji, closeEmoji
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} theme={theme} />;
	}
	return (
		<ToggleEmojiButton
			show={showEmojiKeyboard}
			open={openEmoji}
			close={closeEmoji}
			theme={theme}
		/>
	);
});

LeftButtons.propTypes = {
	theme: PropTypes.string,
	showEmojiKeyboard: PropTypes.bool,
	openEmoji: PropTypes.func.isRequired,
	closeEmoji: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired
};

export default LeftButtons;
