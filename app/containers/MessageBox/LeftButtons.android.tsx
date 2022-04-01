import React from 'react';

import { CancelEditingButton, ToggleEmojiButton } from './buttons';

interface IMessageBoxLeftButtons {
	showEmojiKeyboard: boolean;
	openEmoji(): void;
	closeEmoji(): void;
	editing: boolean;
	editCancel(): void;
}

const LeftButtons = React.memo(({ showEmojiKeyboard, editing, editCancel, openEmoji, closeEmoji }: IMessageBoxLeftButtons) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} />;
	}
	return <ToggleEmojiButton show={showEmojiKeyboard} open={openEmoji} close={closeEmoji} />;
});

export default LeftButtons;
